import sqlite3
import hashlib
import pyttsx3
from kivy.lang import Builder
from kivymd.app import MDApp
from kivy.uix.screenmanager import ScreenManager, Screen, FadeTransition, FallOutTransition, RiseInTransition, WipeTransition, SwapTransition, SlideTransition
from kivy.core.window import Window
from kivy.metrics import dp
from kivymd.uix.fitimage import FitImage
from kivymd.toast import toast
from intellicards import LoginScreen, SignupScreen, HomeScreen, ModulesScreen, CreateDecks, QuizScreen, ScoreScreen, DeckScreen, SubjectScreen, FilipinoScreen, FilModScreen, FilRecScreen, FilLinksScreen, MathScreen, MathModScreen, MathRecScreen, MathLinksScreen, EnglishScreen, EngModScreen, EngRecScreen, EngLinksScreen, ScienceScreen, SciModScreen, SciRecScreen, SciLinksScreen, QuizMedScreen, AddScreen, AddMediumScreen, AddHardScreen, QuizHardScreen
from kivy.uix.filechooser import FileChooserIconView
from kivy.uix.popup import Popup
import os
import webbrowser
import shutil
from kivymd.uix.menu import MDDropdownMenu
from kivymd.uix.filemanager import MDFileManager
from kivy.core.window import Window
from kivymd.uix.button import MDRaisedButton
from kivymd.uix.dialog import MDDialog
from kivy.utils import platform
from kivymd.app import MDApp
from kivymd.uix.list import OneLineListItem
from kivy.uix.boxlayout import BoxLayout
from plyer import filechooser
from kivy.uix.video import Video
from kivymd.uix.textfield import MDTextField
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.screen import MDScreen
from kivymd.uix.list import OneLineIconListItem, IconLeftWidget, IconRightWidget
from threading import Thread
from kivy.core.audio import SoundLoader



Window.size = (360, 640)


class IntellicardsApp(MDApp):
    def build(self):
        self.db_path = "intellicards.db"
        self.conn = sqlite3.connect(self.db_path)

        self.cursor = self.conn.cursor()
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS module_links (
                module TEXT PRIMARY KEY,
                url TEXT
            )
        """)
        self.theme_cls.theme_style = "Light"
        self.theme_cls.primary_palette = "Blue"
        self.conn = sqlite3.connect("users.db")

        self.tts_engine = pyttsx3.init()
        self.tts_engine.setProperty('rate', 125)


        self.music = SoundLoader.load('assets/music/quiz_music.mp3')
        if self.music:
            self.music.loop = True
            self.music.volume = 0.5
            self.music_playing = False
            




        self.create_table()
        self.load_quiz_data()

        sm = ScreenManager(transition=FadeTransition(duration=0.4))
        sm.add_widget(LoginScreen(name="login"))
        sm.add_widget(SignupScreen(name="signup"))
        sm.add_widget(HomeScreen(name="home"))
        sm.add_widget(ModulesScreen(name="Difficulty"))
        sm.add_widget(CreateDecks(name="Decks"))
        sm.add_widget(QuizScreen(name="quiz"))
        sm.add_widget(ScoreScreen(name="score"))
        sm.add_widget(DeckScreen(name="decks"))
        sm.add_widget(SubjectScreen(name="Subjects"))
        sm.add_widget(FilipinoScreen(name="Subject1"))
        sm.add_widget(FilModScreen(name="FilMod"))
        sm.add_widget(FilRecScreen(name="FilRec"))
        sm.add_widget(FilLinksScreen(name="FilLink"))
        sm.add_widget(MathScreen(name="Subject2"))
        sm.add_widget(MathModScreen(name="MathMod"))
        sm.add_widget(MathRecScreen(name="MathRec"))
        sm.add_widget(MathLinksScreen(name="MathLink"))
        sm.add_widget(EnglishScreen(name="Subject3"))
        sm.add_widget(EngModScreen(name="EngMod"))
        sm.add_widget(EngRecScreen(name="EngRec"))
        sm.add_widget(EngLinksScreen(name="EngLink"))
        sm.add_widget(ScienceScreen(name="Subject4"))
        sm.add_widget(SciModScreen(name="SciMod"))
        sm.add_widget(SciRecScreen(name="SciRec"))
        sm.add_widget(SciLinksScreen(name="SciLink"))
        sm.add_widget(QuizMedScreen(name="QuizMed"))
        sm.add_widget(AddScreen(name="Add"))
        sm.add_widget(AddMediumScreen(name="AddMedium"))
        sm.add_widget(AddHardScreen(name="AddHard"))
        sm.add_widget(QuizHardScreen(name="QuizHard"))
        
        

        return sm
    

    background_music = None
    music_playing = True

    def speak_text(self, text):
        if text:
            Thread(target=self._speak, args=(text,), daemon=True).start()

    def _speak(self, text):
        try:
            resume_music = False
            if self.music and self.music_playing:
                self.music.stop()
                resume_music = True

            if "ang" in text.lower() or "siya" in text.lower():
                self.set_voice_by_language("fil")
            else:
                 self.set_voice_by_language("en")

            self.tts_engine.stop() 
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()

            if resume_music:
                self.music.play()

        except Exception as e:
            print(f"TTS Error: {e}")



    def set_voice_by_language(self, lang_code):
        for voice in self.tts_engine.getProperty('voices'):
            if lang_code in str(voice.languages).lower():
                self.tts_engine.setProperty('voice', voice.id)
                break


    def play_music(self):
       if self.music and not self.music_playing:
            self.music.play()
            self.music_playing = True

    def stop_music(self):
        if self.music and self.music_playing:
            self.music.stop()
            self.music_playing = False

    def toggle_music(self):
        if self.music_playing:
            self.stop_music()
        else:
            self.play_music()







    def open_pdf_filechooser(self, module_name="Filipino_Module_1"):
        content = FileChooserIconView(filters=["*.pdf"])
    
        popup = Popup(title="Select PDF to Upload",
                  content=content,
                  size_hint=(0.9, 0.9))
        
        
    
        def on_selection(*args):
            if content.selection:
                selected = content.selection[0]

            if not selected.lower().endswith('.pdf'):
                self.show_message("Please select a PDF file.")
                return
            
            dest_folder = os.path.join(os.getcwd(), "pdfs")
            os.makedirs(dest_folder, exist_ok=True)
            dest_path = os.path.join(dest_folder, os.path.basename(selected))
            shutil.copy(selected, dest_path)
            
            
            self.save_pdf_path(module_name, dest_path)
            
            popup.dismiss()
            self.show_message(f"Uploaded PDF: {os.path.basename(selected)}")
    
        content.bind(on_submit=on_selection)    
        
        popup.open()



    def save_pdf_path(self, module_name, pdf_path):
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS module_pdfs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                module TEXT UNIQUE,
                pdf_path TEXT
            )
        """)
        cursor.execute("""
            INSERT OR REPLACE INTO module_pdfs (module, pdf_path) VALUES (?, ?)
        """, (module_name, pdf_path))
        self.conn.commit()

    def open_pdf_external(self, module_name="Filipino_Module_1"):
        cursor = self.conn.cursor()
        cursor.execute("SELECT pdf_path FROM module_pdfs WHERE module = ?", (module_name,))
        result = cursor.fetchone()
        if result:
            pdf_path = result[0]
            if os.path.exists(pdf_path):
                try:
                    if os.name == 'nt':
                        os.startfile(pdf_path)
                    elif os.name == 'posix':
                        webbrowser.open(f"file://{pdf_path}")
                    else:
                        self.show_message("Unsupported OS for opening PDF")
                except Exception as e:
                    self.show_message(f"ERROR opening PDF: {e}")
            else:
                self.show_message("PDF file not found.")
        else:
            self.show_message("No PDF uploaded yet for this module.")


    def open_module_actions(self, module_name):
        self.current_module = module_name
        self.dialog = MDDialog(
            title=f"{module_name.replace('_', ' ')} PDF Options",
            buttons=[
                MDRaisedButton(text="Upload", on_release=lambda x: self.upload_pdf(module_name)),
                MDRaisedButton(text="View", on_release=lambda x: self.view_pdf(module_name)),
                MDRaisedButton(text="Delete", on_release=lambda x: self.delete_pdf(module_name)),
            ]
        )
        self.dialog.open()

    def get_pdf_path(self, module_name):
        base_path = os.path.join(self.user_data_dir, "pdfs")
        os.makedirs(base_path, exist_ok=True)
        return os.path.join(base_path, f"{module_name}.pdf")

    def upload_pdf(self, module_name):
        from plyer import filechooser
        filechooser.open_file(on_selection=lambda paths: self._save_pdf(paths, module_name))
        self.dialog.dismiss()

    def _save_pdf(self, paths, module_name):
        if not paths:
            return
        selected_path = paths[0]
        target_path = self.get_pdf_path(module_name)
        with open(selected_path, 'rb') as src, open(target_path, 'wb') as dst:
            dst.write(src.read())
        toast("PDF uploaded successfully!")

    def view_pdf(self, module_name):
        path = self.get_pdf_path(module_name)
        if os.path.exists(path):
            if platform == "android":
                from jnius import autoclass
                Intent = autoclass('android.content.Intent')
                Uri = autoclass('android.net.Uri')
                File = autoclass('java.io.File')
                PythonActivity = autoclass('org.kivy.android.PythonActivity')
                context = PythonActivity.mActivity

                file = File(path)
                uri = Uri.fromFile(file)
                intent = Intent()
                intent.setAction(Intent.ACTION_VIEW)
                intent.setDataAndType(uri, "application/pdf")
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
            else:
                webbrowser.open(f"file://{path}")
        else:
            toast("No PDF uploaded.")
        self.dialog.dismiss()

    def delete_pdf(self, module_name):
        path = self.get_pdf_path(module_name)
        if os.path.exists(path):
            os.remove(path)
            toast("PDF deleted.")
        else:
            toast("No PDF to delete.")
        self.dialog.dismiss()


    def get_video_path(self, module_name):
        base_path = os.path.join(self.user_data_dir, "videos")
        os.makedirs(base_path, exist_ok=True)
        return os.path.join(base_path, f"{module_name}.mp4")
    
    def upload_video(self, module_name):
        from plyer import filechooser
        filechooser.open_file(on_selection=lambda paths: self._save_video(paths, module_name))
        self.dialog.dismiss()

    def _save_video(self, paths, module_name):
        if not paths:
            return
        selected_path = paths[0]
        target_path = self.get_video_path(module_name)
        with open(selected_path, 'rb') as src, open(target_path, 'wb') as dst:
            dst.write(src.read())
        toast("Video uploaded successfully!")

    def view_video(self, module_name):
        path = self.get_video_path(module_name)
        if os.path.exists(path):
            if platform == "android":
                from jnius import autoclass
                Intent = autoclass('android.content.Intent')
                Uri = autoclass('android.net.Uri')
                File = autoclass('java.io.File')
                PythonActivity = autoclass('org.kivy.android.PythonActivity')
                context = PythonActivity.mActivity

                file = File(path)
                uri = Uri.fromFile(file)
                intent = Intent()
                intent.setAction(Intent.ACTION_VIEW)
                intent.setDataAndType(uri, "video/mp4")
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)

            else:
                webbrowser.open(f"file://{path}")

        else:
            toast("No video uploaded.")
        self.dialog.dismiss()
    
    def delete_video(self, module_name):
        path = self.get_video_path(module_name)
        if os.path.exists(path):
            try: 
                os.remove(path)
                toast("Video deleted.")
            except PermissionError:
                toast("Cannot delete video: it's currently open or in use.")
            except Exception as e:
                toast(f"Erro deleting video: {e}")
            
        else:
            toast("No video to delete.")
        self.dialog.dismiss()

    def open_video_actions(self, module_name):
        self.current_module = module_name
        self.dialog = MDDialog(
            title=f"{module_name.replace('_', ' ')} Video Options",
            buttons=[
                MDRaisedButton(text="Upload", on_release=lambda x: self.upload_video(module_name)),
                MDRaisedButton(text="View", on_release=lambda x: self.view_video(module_name)),
                MDRaisedButton(text="Delete", on_release=lambda x: self.delete_video(module_name)),
            ]
        )
        self.dialog.open()
            

    def open_link_actions(self, module_name):
        self.current_module = module_name
        self.dialog = MDDialog(
            title=f"{module_name.replace('_', ' ')} Link Options",
            buttons=[
                MDRaisedButton(text="Upload", on_release=lambda x: self.upload_link(module_name)),
                MDRaisedButton(text="View", on_release=lambda x: self.view_link(module_name)),
                MDRaisedButton(text="Delete", on_release=lambda x: self.delete_link(module_name)),
            ]
        )
        self.dialog.open()

    def upload_link(self, module_name):
        if self.dialog:
            self.dialog.dismiss()

        
        box = MDBoxLayout(orientation="vertical", spacing="12dp", padding="12dp")
        link_input = MDTextField(hint_text="Paste hyperlink", multiline=False)
        box.add_widget(link_input)
    
        def save_link(obj):
            url = link_input.text.strip()
            if url:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                cursor.execute(
                    "REPLACE INTO module_links (module, url) VALUES (?, ?)",
                    (module_name, url),
                )
                conn.commit()
                conn.close()
            self.dialog.dismiss()


        self.dialog = MDDialog(
            title="Upload Hyperlink",
            type="custom",
            content_cls=box,
            buttons=[
                MDRaisedButton(text="Save", on_release=save_link),
                MDRaisedButton(text="Cancel", on_release=lambda x: self.dialog.dismiss()),
            ]
        )
        self.dialog.open()


    def view_link(self, module_name):
        if self.dialog:
            self.dialog.dismiss()
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT url FROM module_links WHERE module = ?", (module_name,))
        result = cursor.fetchone()
        conn.close()
        if result:
            webbrowser.open(result[0])
        else:
            toast("No link stored yet.")

    def delete_link(self, module_name):
        if self.dialog:
            self.dialog.dismiss()
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM module_links WHERE module = ?", (module_name,))
        conn.commit()
        conn.close()
        toast("Link deleted.")




    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.quiz_data = {
            "easy": []
        }

    def add_question(self, question_text, answer_text):
        if not question_text or not answer_text:
            toast("Please fill in both question and answer")
            return
        
        answer_text = answer_text.strip().lower()
        if answer_text not in ["true", "false"]:
            toast("Answer must be 'True' or 'False'.")
            return

        new_question = {
            "subject": "FILIPINO",  # You can change or make this dynamic
            "question": question_text,
            "answer": True if answer_text == "true" else False
        }

        self.quiz_data["easy"].append(new_question)

        add_screen = self.root.get_screen("Add")
        add_screen.ids.question_input.text = ""
        add_screen.ids.answer_input.text = ""

        toast("Question added!")

   
    def refresh_quiz_screen(self):
        quiz_screen = self.root.get_screen("Quiz")  # adjust name if different
        quiz_screen.load_questions(self.questions)

    def load_questions(self, questions):
        self.questions = questions
        self.current_index = 0
        self.display_question()







    def submit_medium_question(self):
        screen = self.root.get_screen("AddMedium")
        question = screen.ids.question_input.text
        options = [
            screen.ids.option_a.text,
            screen.ids.option_b.text,
            screen.ids.option_c.text,
            screen.ids.option_d.text
        ]
        correct_letter = screen.ids.correct_letter.text.upper()

        if not question or not all(options) or correct_letter not in ["A", "B", "C", "D"]:
            toast("Please fill out all fields correctly (A/B/C/D)")
            return
        
        correct_index = ["A", "B", "C", "D"].index(correct_letter)
        new_question = {"subject": "FILIPINO",
            "question": question,
            "options": options,
            "answer": correct_index
        }
        self.quiz_data["medium"].append(new_question)

        screen.ids.question_input.text = ""
        screen.ids.option_a.text = ""
        screen.ids.option_b.text = ""
        screen.ids.option_c.text = ""
        screen.ids.option_d.text = ""
        screen.ids.correct_letter.text = ""

        toast("Question added!")





    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.questions = [] 

    def submit_hard_question(self):
        screen = self.root.get_screen("AddHard")
        question = screen.ids.question_input.text.strip()
        answer = screen.ids.answer_input.text.strip()

        if not question or not answer:
            toast("Please fill in both fields.")
            return
        
        new_question = {
            "subject": "FILIPINO",  # or allow user to select subject
            "question": question,
            "answer": answer
        }

        self.quiz_data["hard"].append(new_question)
        toast("Question added!")
    
        screen.ids.question_input.text = ""
        screen.ids.answer_input.text = ""

        
        

    










        
            
    def load_quiz_data(self):
        self.quiz_data = {
            "easy": [
                {"subject": "Quiz Deck", "question": "is Python a programming language.", "answer": True},
                {"subject": "Quiz Deck", "question": "Botany is the study of animals.", "answer": False},
                {"subject": "Quiz Deck", "question": "Zoology is the study of Animals", "answer": True},
            ],
            "medium": [
                {"subject": "Quiz Deck", "question": "Is Indentation Required in Python?", 
                 "options": ["Yes, indentation is required in Python", "No, indentation is not required in python", "Both A and B", "None of the above"], 
                 "answer": 0},
                {"subject": "Quiz Deck", "question": "What is a break, continue and pass in Python?", 
                 "options": ["To exit", "is used to terminate the loop or statement in which it is present. l", "To take a break", "Nothing"], 
                 "answer": 1},
            ],
            "hard": [
                {"subject": "Quiz Deck", "question": "What programming language can you use Py game",
                 "answer": "Python"}, 
                 {"subject": "Quiz Deck", "question": "A Blank function is an anonymous function.",
                 "answer": "lambda"},
            ]
        }

    def start_quiz(self, difficulty):
        self.current_difficulty = difficulty
        self.filtered_questions = self.quiz_data.get(difficulty, [])
        self.current_question_index = 0
        self.correct_answers = 0
        
        if not self.filtered_questions:
            toast("No questions available for this difficulty")
            return
            
        if difficulty == "medium":
            self.root.current = "QuizMed"

        elif difficulty == "hard":
            self.root.current = "QuizHard"
            
        else:
            self.root.current = "quiz"
        
        self.show_question()
        self.play_music()
        
    def show_question(self):
        if self.current_question_index >= len(self.filtered_questions):
            self.finish_quiz(
                correct_answers=self.correct_answers,
                total_questions=len(self.filtered_questions),
                subject=self.filtered_questions[0]["subject"]
            )
            return
            
        question = self.filtered_questions[self.current_question_index]


        if self.current_difficulty == "medium":
            quiz_screen = self.root.get_screen("QuizMed")
            quiz_screen.update_question(
                subject=question["subject"],
                current=self.current_question_index + 1,
                total=len(self.filtered_questions),
                question_text=question["question"],
                options=question["options"]
            )
        elif self.current_difficulty == "hard":
            quiz_screen = self.root.get_screen("QuizHard")
            quiz_screen.update_question(
                subject=question["subject"],
                current=self.current_question_index + 1,
                total=len(self.filtered_questions),
                question_text=question["question"]
            )
        else:
            quiz_screen = self.root.get_screen("quiz")
            quiz_screen.update_question(
                subject=question["subject"],
                current=self.current_question_index + 1,
                total=len(self.filtered_questions),
                question_text=question["question"]
            )


    def check_answer(self, user_answer):
        current_question = self.filtered_questions[self.current_question_index]
        
        if self.current_difficulty == "medium":
            # For medium difficulty (multiple choice)
            correct = (user_answer == current_question["answer"])
        elif self.current_difficulty == "hard":
            correct = user_answer.strip().lower() == current_question["answer"].strip().lower()
        else:
            correct = (user_answer == current_question["answer"])
        
        if correct:
            self.correct_answers += 1
            toast("Correct!")
        
        else:
            toast("Incorrect!")
        
        self.next_question()

    def next_question(self):
        self.current_question_index += 1
        self.show_question()
    
    def finish_quiz(self, correct_answers, total_questions, subject):
        score_screen = self.root.get_screen("score")
        score_screen.update_score(correct_answers, total_questions, subject)
        self.root.current = "score"
        self.stop_music()
        
    def change_screen(self, screen_name):
        self.root.current = screen_name
    
    def show_decks(self):
        print("Preparing decks...")
        deck_screen = self.root.get_screen("Decks")
        


    def create_table(self):
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        """)
        self.conn.commit()



        cursor.execute("""
            CREATE TABLE IF NOT EXISTS module_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module TEXT UNIQUE,
            url TEXT
        )
    """)

    def hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()

    def signup(self, username, password, confirm_password):
        if not username or not password or not confirm_password:
            self.show_message("Please fill all fields.")
            return

        if password != confirm_password:
            self.show_message("Passwords do not match.")
            return

        hashed_password = self.hash_password(password)

        try:
            cursor = self.conn.cursor()
            cursor.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                (username, hashed_password)
            )
            self.conn.commit()
            self.show_message("Account created successfully!")
            self.root.current = "login"

            # Clear signup fields
            signup_screen = self.root.get_screen("signup")
            signup_screen.ids.username_signup.text = ""
            signup_screen.ids.password_signup.text = ""
            signup_screen.ids.confirm_password_signup.text = ""

        except sqlite3.IntegrityError:
            self.show_message("Username already exists.")

    def login(self, username, password):
        if not username or not password:
            self.show_message("Please enter username and password.")
            return

        hashed_password = self.hash_password(password)
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            (username, hashed_password)
        )
        user = cursor.fetchone()
        if user:
            self.show_message(f"Welcome {username}!")
            self.root.current = "home"
            # Clear login fields
            login_screen = self.root.get_screen("login")
            login_screen.ids.username.text = ""
            login_screen.ids.password.text = ""
        else:
            self.show_message("Invalid username or password.")

    def show_message(self, message):
        toast(message)

    def on_stop(self):
        self.conn.close()

if __name__ == "__main__":
    IntellicardsApp().run()