package expo.modules.systemdownloads

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

internal class StorageUnavailableException :
  CodedException("Shared storage is not available on this device")

internal class InvalidFileNameException(name: String) :
  CodedException("'$name' is not a plain file name")

/**
 * Hands large downloads to Android's DownloadManager, so they keep going while
 * the app is minimised or closed, survive network changes and show the system
 * download notification. Files land in the app's own folder on shared storage
 * (`Android/data/<app>/files/<folder>`): no permission needed, private to the
 * app since Android 11, and removed on uninstall.
 */
class SystemDownloadsModule : Module() {
  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  private val manager: DownloadManager
    get() = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager

  /** Created on demand; null when shared storage is unavailable. */
  private fun folder(name: String): File? = context.getExternalFilesDir(name)

  /** Only plain names inside our own folder: nothing else on the device can be touched. */
  private fun fileIn(folder: File, name: String): File {
    val file = File(folder, name)
    if (file.canonicalFile.parentFile != folder.canonicalFile) throw InvalidFileNameException(name)
    return file
  }

  override fun definition() = ModuleDefinition {
    Name("SystemDownloads")

    Function("directory") { folderName: String ->
      folder(folderName)?.absolutePath
    }

    Function("enqueue") { url: String, folderName: String, fileName: String, title: String, description: String ->
      val directory = folder(folderName) ?: throw StorageUnavailableException()
      // DownloadManager writes "name-1" rather than overwrite, so clear the target first.
      fileIn(directory, fileName).delete()
      val request = DownloadManager.Request(Uri.parse(url))
        .setTitle(title)
        .setDescription(description)
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
        .setDestinationInExternalFilesDir(context, folderName, fileName)
        .setAllowedOverRoaming(false)
      manager.enqueue(request)
    }

    Function("query") { ids: LongArray ->
      val rows = mutableListOf<Map<String, Any?>>()
      if (ids.isEmpty()) return@Function rows
      manager.query(DownloadManager.Query().setFilterById(*ids))?.use { cursor ->
        val idColumn = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_ID)
        val statusColumn = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS)
        val reasonColumn = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON)
        val doneColumn = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
        val totalColumn = cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
        while (cursor.moveToNext()) {
          val status = cursor.getInt(statusColumn)
          rows += mapOf(
            "id" to cursor.getLong(idColumn),
            "status" to statusName(status),
            "reason" to reasonName(status, cursor.getInt(reasonColumn)),
            "bytesDownloaded" to cursor.getLong(doneColumn),
            "totalBytes" to cursor.getLong(totalColumn)
          )
        }
      }
      rows
    }

    Function("remove") { ids: LongArray ->
      if (ids.isEmpty()) 0 else manager.remove(*ids)
    }

    /** Atomic rename inside one folder (expo-file-system cannot create new files on shared storage). */
    Function("rename") { folderName: String, from: String, to: String ->
      val directory = folder(folderName) ?: throw StorageUnavailableException()
      val target = fileIn(directory, to)
      target.delete()
      fileIn(directory, from).renameTo(target)
    }
  }

  private fun statusName(status: Int): String = when (status) {
    DownloadManager.STATUS_PENDING -> "pending"
    DownloadManager.STATUS_RUNNING -> "running"
    DownloadManager.STATUS_PAUSED -> "paused"
    DownloadManager.STATUS_SUCCESSFUL -> "successful"
    else -> "failed"
  }

  private fun reasonName(status: Int, reason: Int): String? = when (status) {
    DownloadManager.STATUS_PAUSED -> when (reason) {
      DownloadManager.PAUSED_WAITING_FOR_NETWORK -> "waiting-for-network"
      DownloadManager.PAUSED_QUEUED_FOR_WIFI -> "waiting-for-wifi"
      DownloadManager.PAUSED_WAITING_TO_RETRY -> "retrying"
      else -> "paused"
    }
    DownloadManager.STATUS_FAILED -> when (reason) {
      DownloadManager.ERROR_INSUFFICIENT_SPACE -> "no-space"
      DownloadManager.ERROR_DEVICE_NOT_FOUND -> "no-storage"
      else -> "failed"
    }
    else -> null
  }
}
