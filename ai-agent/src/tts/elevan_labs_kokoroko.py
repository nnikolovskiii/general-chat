from elevenlabs import ElevenLabs

context = """Excellent! Your breakdown is incredibly sharp and covers the core pillars of starting a modern, likely tech-focused, business. You've correctly identified that it's a blend of technical execution and business acumen.
"""
client = ElevenLabs(
    api_key="fnBvmpKRxOSWoWV7iOByWwasH8Kppyvp",
    base_url="https://api.deepinfra.com/",
)

output_filename = "output_audio.mp3"

response = client.text_to_speech.convert(
    voice_id="af_bella",
    output_format="mp3",
    text=context,
    model_id="hexgrad/Kokoro-82M",
)

with open(output_filename, "wb") as f:
    for chunk in response:
        f.write(chunk)