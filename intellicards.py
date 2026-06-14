from kivymd.uix.screen import MDScreen


class LoginScreen(MDScreen):
    pass

class SignupScreen(MDScreen):
    pass

class HomeScreen(MDScreen):
    pass

class ModulesScreen(MDScreen):
    pass

class CreateDecks(MDScreen):
    pass

class QuizScreen(MDScreen):
    def update_question(self, subject, current, total, question_text):
        self.ids.subject_label.text = subject
        self.ids.progress_label.text = f"{current}/{total}"
        self.ids.question_label.text = question_text
        
class ScoreScreen(MDScreen):
    def update_score(self, score, total, subject):
        self.ids.score_label.text = f"{score} / {total}"
        self.ids.subject_label.text = subject
        
class QuizMedScreen(MDScreen):
    def update_question(self, subject, current, total, question_text, options):
        self.ids.subject_label.text = subject
        self.ids.progress_label.text = f"{current}/{total}"
        self.ids.question_label.text = question_text
        
        # Update the multiple choice buttons
        self.ids.button_a.text = f"A: {options[0]}"
        self.ids.button_b.text = f"B: {options[1]}"
        self.ids.button_c.text = f"C: {options[2]}"
        self.ids.button_d.text = f"D: {options[3]}"

class DeckScreen(MDScreen):
    pass

class SubjectScreen(MDScreen):
    pass

class FilipinoScreen(MDScreen):
    pass

class FilModScreen(MDScreen):
    pass

class FilRecScreen(MDScreen):
    pass

class FilLinksScreen(MDScreen):
    pass

class MathScreen(MDScreen):
    pass

class MathModScreen(MDScreen):
    pass

class MathRecScreen(MDScreen):
    pass

class MathLinksScreen(MDScreen):
    pass

class EnglishScreen(MDScreen):
    pass

class EngModScreen(MDScreen):
    pass

class EngRecScreen(MDScreen):
    pass

class EngLinksScreen(MDScreen):
    pass

class ScienceScreen(MDScreen):
    pass

class SciModScreen(MDScreen):
    pass

class SciRecScreen(MDScreen):
    pass

class SciLinksScreen(MDScreen):
    pass

class AddScreen(MDScreen):
    pass

class AddMediumScreen(MDScreen):
    pass

class AddHardScreen(MDScreen):
    pass

class QuizHardScreen(MDScreen):
    def update_question(self, subject, current, total, question_text):
        self.ids.subject_label.text = subject
        self.ids.progress_label.text = f"{current}/{total}"
        self.ids.question_label.text = question_text
        self.ids.user_input.text = ""