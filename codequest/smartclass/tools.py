import os
import json
import html
import re

def extract_questions_from_html(html_file_path):
    # Baca file HTML
    with open(html_file_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Ekstrak nilai atribut data-page dari elemen <div id="app">
    pattern = r'<div\s+id="app"\s+data-page=[\'"](?P<data>.*?)[\'"]>'
    match = re.search(pattern, html_content, re.DOTALL | re.IGNORECASE)
    if not match:
        raise ValueError("Tidak dapat menemukan atribut data-page pada div dengan id 'app'.")

    json_text = match.group("data")
    json_text = html.unescape(json_text).strip()

    print("Extracted JSON (500 karakter pertama):")
    print(json_text[:500])

    # Parsing JSON
    try:
        data = json.loads(json_text)
    except json.JSONDecodeError as e:
        print("Gagal melakukan parse JSON. Berikut 1000 karakter pertama dari data yang diekstrak:")
        print(json_text[:1000])
        raise ValueError(f"Error parsing JSON: {e}")

    # Ambil array soal dari props → session → questions
    props = data.get("props", {})
    session = props.get("session", {})
    questions = session.get("questions", [])

    if not questions:
        raise ValueError("Array 'questions' tidak ditemukan dalam data JSON.")

    return questions

def filter_questions(questions):
    # Menyaring elemen tertentu dari setiap objek soal
    return [
        {
            
            "question": q.get("question"),
            "options": q.get("options"),
            "correct_answer": q.get("correct_answer")
        }
        for q in questions
    ]

def main():
    current_directory = os.path.dirname(os.path.abspath(__file__))
    html_file = os.path.join(current_directory, "jawaban.html")
    
    # Ekstraksi soal dari file HTML
    questions = extract_questions_from_html(html_file)
    
    # Simpan data soal lengkap ke file JSON
    extracted_output_file = os.path.join(current_directory, "extracted_questions.json")
    with open(extracted_output_file, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=4, ensure_ascii=False)
    print(f"\nData soal telah diekstrak dan disimpan di {extracted_output_file}")
    
    # Filter data soal untuk mengambil elemen tertentu saja
    filtered_questions = filter_questions(questions)
    
    # Simpan data soal yang telah difilter ke file JSON
    filtered_output_file = os.path.join(current_directory, "filtered_questions.json")
    with open(filtered_output_file, "w", encoding="utf-8") as f:
        json.dump(filtered_questions, f, indent=4, ensure_ascii=False)
    print(f"Data yang difilter telah disimpan di {filtered_output_file}")

if __name__ == "__main__":
    main()
