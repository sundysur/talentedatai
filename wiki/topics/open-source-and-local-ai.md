# Topic: Open-Source & Local AI

Running AI models locally — on your own hardware, without sending data to a cloud server — has become practical in 2026. Open-source models with permissive licences (Apache 2.0, MIT) enable commercial use with no per-token costs and no data exposure.

---

## Articles Covering This Topic

| Article | Tool | Key Insight |
|---|---|---|
| [[../articles/google-gemma-4-complete-guide-2026]] | Gemma 4 (E2B/E4B/27B) | Apache 2.0; runs on phones to consumer GPUs; 4× faster than Gemma 3 |
| [[../articles/how-to-run-gemma-4-on-android-2026]] | Gemma 4 on Android | 10-minute setup; fully offline; Google AI Edge Gallery |
| [[../articles/best-ai-image-generators-2026]] | Flux.1 (Black Forest Labs) | Open weights; competitive with paid tools; runs locally with GPU |
| [[../articles/best-ai-video-generators-2026]] | Wan 2.6 | 16GB+ VRAM; unlimited free generations; open-source video |

---

## Why Local AI Matters

- **Privacy:** Queries never leave the device — essential for health, legal, financial data
- **Cost:** After hardware investment, zero marginal cost per inference
- **Licence security:** Apache 2.0 means Google/Meta cannot retroactively change terms
- **Compliance:** Regulated industries (healthcare, legal, defence-adjacent) can use AI without cloud exposure
- **Offline capability:** Works without internet connection

---

## Open-Source Models in 2026

| Model | Creator | Best For | Licence | Hardware |
|---|---|---|---|---|
| **Gemma 4 E2B** | Google | Phones, Raspberry Pi | Apache 2.0 | 4GB RAM |
| **Gemma 4 E4B** | Google | Laptops, most tasks | Apache 2.0 | Consumer GPU/laptop |
| **Gemma 4 27B** | Google | Max capability | Apache 2.0 | RTX 4090 (quantised) |
| **Flux.1** | Black Forest Labs | Image generation | Open weights | GPU required |
| **Wan 2.6** | Open community | Video generation | Open | 16GB+ VRAM |
| **Llama 4** | Meta | General LLM (competitor to Gemma 27B) | Llama licence | Server GPU |
| **Mistral** | Mistral AI | Self-hosted LLM (mature ecosystem) | Various | Consumer GPU |
| **Phi-4** | Microsoft | Small efficient reasoning | MIT | CPU-capable |

---

## Getting Started: Ollama (Easiest Path)

```bash
# Install on macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Run Gemma 4
ollama run gemma4:4b
```

Ollama handles quantisation and hardware detection automatically.

---

## Comparison: Local vs. Cloud AI

| | Local (e.g., Gemma 4) | Cloud (e.g., Claude, ChatGPT) |
|---|---|---|
| Privacy | Complete | Queries logged server-side |
| Cost | Hardware once; zero per-query | $0–$200/month subscriptions |
| Offline | Yes | No |
| Quality | Good for common tasks | Frontier models still significantly better |
| Speed | Slower (hardware-dependent) | Near-instant |

---

## Related Topics

- [[google-ai-ecosystem]] — Gemma 4 in Google's strategy
- [[ai-model-comparisons]] — Cloud model comparison context
- [[ai-image-generation]] — Flux open-source image model
- [[ai-video-generation]] — Wan 2.6 open-source video model
