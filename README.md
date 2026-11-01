# 💀 Calavera AI

**A 100% offline Día de los Muertos companion.** Scan heirlooms for your ofrenda, keep your family's stories in an on-device vector archive, and have an open-weight LLM write a traditional *calaverita literaria* for the people you miss, with the internet off.

Built for the DEV Hacktoberfest 2026 Open-Source AI Challenge, Week 4: *Ghost in the Machine*.

---

## Why offline

Ancestral memories are private. Every model in Calavera AI runs on the phone's own CPU: photos, stories and poems never leave the device, there is no account, and the app keeps working in a cemetery with no signal. It will also never break because an API is sunset.

## The pipeline

```
 📷 Soul Mirror ──────────┐        (Input layer)
   SmolVLM / Gemma 4 vision│  photo → 512px → name + one sentence → cultural placement
                           ▼
 📜 Memory Archive ── sqlite-vec (Storage layer)
   all-MiniLM-L6-v2        │  text → sentence chunks → 384-d vectors → partitioned KNN index
                           ▼
 💀 Calaveritas ───── Gemma 2 2B / Gemma 4 E2B (Output layer)
   RAG prompt              │  top-k memories + ofrenda items → streamed calaverita
                           ▼
 🕯️ Tribute ───────── parchment card · offline TTS · local PNG export · métrica check
```

| Screen | What happens on-device |
| --- | --- |
| **1. Offline AI** | Checks RAM and storage, recommends a model pack, then hands the files to Android's DownloadManager: they download in parallel and keep going while the app is minimised or closed, with the system download notification. Reopening the app picks the download back up, and every file is verified against its Hugging Face SHA-256 before use. |
| **2. El Altar Digital** | A three-tier ofrenda (Cielo · Tierra · Inframundo) built from your scans. Empty slots open the Soul Mirror. |
| **3. Soul Mirror** | A vision-language model names the heirloom. A cultural knowledge base decides its tier and meaning, and the scan becomes a memory. |
| **4. Memory Archive** | Stories are chunked, embedded and stored in sqlite-vec. *Ask the archive* runs semantic search by meaning. |
| **5. Calaveritas** | Pick a loved one, a language (Spanish, English, or the Spanish original with an English translation), a tone (tender ↔ satirical) and a death figure. Retrieved memories ground a streamed poem; the translation streams in as a second pass. |
| **6. Tribute** | Bilingual parchment card, recitation in a Mexican Spanish and/or English voice (system TTS), share or save as PNG, and a per-line rhythm check (Spanish métrica with sinalefa, or an English syllable estimate). |
| **7. Backup & restore** | One `.calavera` file with loved ones, memories, heirloom photos and calaveritas: AES-256-GCM with a PBKDF2-SHA256 (600k) key from a passphrase that never leaves the phone. Send it anywhere, restore on any phone (no duplicates), or share a single loved one with family. |

## Models (all open weights, GGUF via llama.cpp)

| Pack | Writer | Eyes | Embeddings | Download | Target |
| --- | --- | --- | --- | --- | --- |
| **Ofrenda Lite** | Gemma 2 2B Instruct Q4_K_M | SmolVLM 500M Q8_0 + projector | all-MiniLM-L6-v2 Q8_0 | ~2.3 GB | 4–5 GB RAM phones |
| **Ofrenda Plus** | Gemma 4 E2B Instruct Q4_0 | Gemma 4 E2B + vision projector | all-MiniLM-L6-v2 Q8_0 | ~3.4 GB | 6 GB+ RAM phones |

The app reads the device's RAM and recommends a pack. You can switch packs later and remove the one you no longer use.

## Built for low-end phones

- **Inference never touches the JS thread.** llama.rn runs llama.cpp natively through JSI. Tokens are batched into ~12 UI updates per second, and only the poem component subscribes to them.
- **One heavy model in memory.** A FIFO inference queue serialises all model work. Phones under 7.5 GB keep a single generative model resident (LRU eviction), the vision projector is dropped before writing, and large models are released 30 s after the app goes to the background.
- **mmap, not malloc.** Weights are memory-mapped (`use_mmap`, no `mlock`), with a 2K context, a single sequence and 4 threads for the big cores.
- **Prompts that cache.** The calaverita rules are an identical prefix on every request, so llama.cpp reuses their KV cache. Retrieved context is capped at ~1,100 characters to keep CPU prefill short.
- **Small inputs.** Photos are downscaled to 512 px before vision inference (fewer image tokens, smaller thumbnails on disk). Image tokens are capped at 256.
- **No sampling grammar for vision.** We first forced JSON with a llama.cpp grammar (JSON schema → GBNF). On a weak CPU it cost ~4.7 s per token and a scan took over 10 minutes. The vision model now answers the way small models naturally do ("Candle. It has an orange flame."), which a forgiving, unit-tested parser reads; the same scan takes under 30 s. A repetition penalty stops small-model loops.
- **Lean rendering.** React Compiler auto-memoisation, Hermes, the New Architecture, `inlineRequires` (modules load on first use), FlashList, `activityEnabled` screens, UI-thread Reanimated candles that respect *reduce motion*, and a progress bar driven by `scaleX` (no layout passes).
- **Less native code.** Optional expo-router dependencies the app never uses (gesture-handler and masked-view, needed only by the JS stack and drawer) are excluded from autolinking in `package.json`. llama.rn's Snapdragon Hexagon/OpenCL build and HTP blobs (~16 MB, unused because inference is CPU-only) are left out of the APK by `plugins/withCpuOnlyLlama.js`. The APK ships only arm64-v8a and x86_64, the two ABIs llama.cpp supports.
- **SQLite tuned.** WAL, `synchronous=NORMAL`, indexed foreign keys, and a vec0 table partitioned by ancestor so per-person KNN scans only their memories.

## Project structure

```
src/
  app/                 Expo Router routes only (thin wrappers around feature screens)
  db/                  SQLite connection, sqlite-vec loading, versioned migrations
  features/
    engine/            llama.rn context manager, embeddings, lifecycle, loading UI
    models/            registry, downloader, verification, pack lifecycle, setup screen
    hub/               El Altar Digital screen
    ofrenda/           tiers, cultural placement rules, altar components, repo
    mirror/            camera capture, image prep, vision analysis
    memories/          chunker, vector repo, RAG search, archive components
    profiles/          loved ones: repo, hooks, form, picker
    archive/           archive screens
    verse/             prompt, tones, scratchpad parser, meter, generator, streaming UI
    tributes/          card, recitation, export, meter analysis
  shared/              theme tokens, UI primitives, query client and keys, utilities
plugins/               Expo config plugins (Windows native build fix, CPU-only llama.rn packaging)
modules/               Local Expo modules: system-downloads (Android DownloadManager), passphrase-key (PBKDF2)
```

State management: **TanStack Query** for everything read from SQLite or disk (with `networkMode: 'always'`, so it works in airplane mode). **zustand** for download progress, model loading and the streaming poem session. Model settings are persisted through expo-sqlite's synchronous key-value store.

## Run it

Requirements: Node 20+, JDK 17, Android SDK with an arm64 device or an x86_64 emulator.

```bash
npm install
npm run prebuild          # generates ./android from app.json (CNG)
npm run android:release   # builds and installs a release APK
```

Other scripts: `npm test` (meter, chunker, scratchpad parser and ofrenda placement), `npm run typecheck`, `npm run lint`, `npm run doctor`.

The first launch downloads the chosen model pack. Use Wi-Fi.

### Troubleshooting

- **`ninja: error: ... Filename longer than 260 characters` on Windows**: React Native's generated C++ produces object paths past the Windows limit, and the NDK's default CMake 3.22.1 ships a ninja that can't use long paths. `plugins/withWindowsNativeBuild.js` (applied from `app.json`) pins SDK CMake 3.31.6 on Windows hosts (it bundles ninja 1.12, which handles long paths) and keeps CMake intermediates in `C:\rncxx`. Install that CMake once: Android Studio → Settings → Languages & Frameworks → Android SDK → SDK Tools → *Show Package Details* → CMake 3.31.6, or `sdkmanager "cmake;3.31.6"`. Windows long paths must be enabled (`LongPathsEnabled=1`). Re-run `npm run prebuild` after changing plugins.
- **`llama.rn` postinstall fails on Windows with `tar: Cannot connect to C:`**: Git Bash's GNU tar is first on `PATH` and reads `C:` as a remote host. Re-run the downloader from PowerShell or `cmd`, where Windows' own `tar.exe` is used: `node node_modules/llama.rn/install/download-native-artifacts.js`.

## License

MIT. The models keep their own licenses: Gemma 2 (Gemma Terms of Use), Gemma 4 (Apache 2.0), SmolVLM (Apache 2.0), all-MiniLM-L6-v2 (Apache 2.0).
