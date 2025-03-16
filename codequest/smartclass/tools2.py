import os
import json

# Lokasi file JSON yang sudah diekstrak sebelumnya
current_directory = os.path.dirname(os.path.abspath(__file__))
input_file = os.path.join(current_directory, "extracted_questions.json")
output_file = os.path.join(current_directory, "filtered_questions.json")

# Membaca file JSON
with open(input_file, "r", encoding="utf-8") as f:
    questions = json.load(f)

# Menyaring hanya elemen yang diperlukan
filtered_questions = [
    {
        "id": q["id"],
        "code": q["code"],
        "question": q["question"],
        "options": q["options"],
        "correct_answer": q["correct_answer"]
    }
    for q in questions
]

# Simpan hasil filter ke file JSON baru
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(filtered_questions, f, indent=4, ensure_ascii=False)

print(f"Data yang difilter telah disimpan di {output_file}")
