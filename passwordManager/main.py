from tkinter import *
from tkinter import simpledialog
import sqlite3, hashlib
from functools import partial
import uuid
import pyperclip
import base64
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet

#Encryption/Decryption Information
backend = default_backend()
salt = b'9999'
kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length= 32,
    salt = salt,
    iterations=100000,
    backend=backend
)

encryptionKey = 0

def encrypt(message: bytes, key: bytes) -> bytes:
    return Fernet(key).encrypt(message)

def decrypt(message: bytes, token: bytes) -> bytes:
    return Fernet(token).decrypt(message)

#Database
with sqlite3.connect("passVault.db") as db:
    cursor = db.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS masterpassword(
id INTEGER PRIMARY KEY,
password TEXT NOT NULL,
recoveryKey TEXT NOT NULL);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS passVault(
id INTEGER PRIMARY KEY,
website TEXT NOT NULL,
username TEXT NOT NULL,
password TEXT NOT NULL);
""")

#Creates PopUp
def popUp(text):
    answer = simpledialog.askstring("input string", text)

    return answer


#Initializing the window
window = Tk()
window.update()

window.title("Password Vault")

def hashPass(input):
    hash = hashlib.sha256(input)
    hash = hash.hexdigest()

    return hash

def firstScreen():
    for widget in window.winfo_children():
        widget.destroy()

    window.geometry("250x150")

    label = Label(window, text = "Create Overall Password")
    label.config(anchor=CENTER)
    label.pack()

    text = Entry(window, width=20, show="*")
    text.pack()
    text.focus()

    labelOne = Label(window, text="Re-enter Password")
    labelOne.config(anchor=CENTER)
    labelOne.pack()

    textOne = Entry(window, width=25, show="*")
    textOne.pack()

    labelTwo = Label(window, text="")
    labelTwo.pack()

    def savePass():
        if text.get() == textOne.get():
            sql = "DELETE FROM masterpassword WHERE id = 1"
            cursor.execute(sql)

            hashedPassword = hashPass(text.get().encode('utf-8'))
            key = str(uuid.uuid4().hex)
            recoveryKey = hashPass(key.encode('utf-8'))

            global encryptionKey
            encryptionKey = base64.urlsafe_b64encode(kdf.derive(text.get().encode()))

            insert_password = """INSERT INTO masterpassword(password, recoveryKey)
                VALUES(?, ?) """
            cursor.execute(insert_password, ((hashedPassword), (recoveryKey)))
            db.commit()

            recoveryScreen(key)
        else:
            labelTwo.config(text="Passwords Do Not Match")

    btn = Button(window, text="Save", command=savePass)
    btn.pack(pady=5)

def recoveryScreen(key):
    for widget in window.winfo_children():
        widget.destroy()

    window.geometry("250x150")

    label = Label(window, text="Save Recovery Key")
    label.config(anchor=CENTER)
    label.pack()

    labelOne = Label(window, text=key)
    labelOne.config(anchor=CENTER)
    labelOne.pack()

    def copyKey():
        pyperclip.copy(labelOne.cget("text"))

    btn = Button(window, text="Copy Key", command=copyKey)
    btn.pack(pady=5)

    def done():
        passVault()

    btn1 = Button(window, text="Done", command=done)
    btn1.pack(pady=5)

    
def resetScreen():
    for widget in window.winfo_children():
        widget.destroy()

    window.geometry("250x150")

    label = Label(window, text = "Enter Recovery Key")
    label.config(anchor=CENTER)
    label.pack()

    text = Entry(window, width=20)
    text.pack()
    text.focus()

    labelOne = Label(window)
    labelOne.config(anchor=CENTER)
    labelOne.pack()

    def getRecoveryKey():
        checkKey = hashPass(str(text.get()).encode('utf-8'))
        cursor.execute('SELECT * FROM masterpassword WHERE id = 1 AND recoveryKey = ?', [(checkKey)])
        return cursor.fetchall()

    def checkRecoveryKey():
        check = getRecoveryKey()

        if check:
            firstScreen()
        else:
            text.delete(0, 'end')
            labelOne.config(text="Key is Incorrect. Please Try Again!")

    btn1 = Button(window, text="Check Key", command=checkRecoveryKey)
    btn1.pack(pady=5)

def loginScreen():

    for widget in window.winfo_children():
        widget.destroy()

    window.geometry("250x125")

    label = Label(window, text ="Enter Overall Password")
    label.config(anchor=CENTER)
    label.pack()

    text = Entry(window, width = 20, show="*")
    text.pack()
    text.focus()

    labelOne = Label(window)
    labelOne.config(anchor=CENTER)
    labelOne.pack(side=TOP)

    def getOverallPassword():
        checkHashedPassword = hashPass(text.get().encode('utf-8'))

        global encryptionKey
        encryptionKey = base64.urlsafe_b64encode(kdf.derive(text.get().encode()))

        cursor.execute("SELECT * FROM masterpassword WHERE id = 1 AND password = ?", [(checkHashedPassword)])
        print(checkHashedPassword)
        return cursor.fetchall()

    def checkPass():
        match = getOverallPassword()

        print(match)
        if match:
            passVault()
        else:
            text.delete(0, 'end')
            labelOne.config(text="Wrong Password")

    def resetPass():
        resetScreen()

    
    btn = Button(window, text="Submit", command=checkPass)
    btn.pack(pady=5)

    btn = Button(window, text="Reset Password", command=resetPass)
    btn.pack(pady=5)

def passVault():
    for widget in window.winfo_children():
        widget.destroy()

    def addEntry():
        text1 = "Website"
        text2 = "Username"
        text3 = "Password"

        website = encrypt(popUp(text1).encode(), encryptionKey)
        username = encrypt(popUp(text2).encode(), encryptionKey)
        password = encrypt(popUp(text3).encode(), encryptionKey)

        insert_fields = """ INSERT INTO passVault(website,username,password)
        VALUES(?, ?, ?)
        """
        cursor.execute(insert_fields,(website, username, password))
        db.commit()
        passVault()

    def delEntry(input):
        cursor.execute("DELETE FROM passVault WHERE id =?", (input,))
        db.commit()

        passVault()

    window.geometry("750x550")
    window.resizable(height=None, width=None)
    label = Label(window, text="Password Vault")
    label.grid(column=1)

    button = Button(window, text="+", command=addEntry)
    button.grid(column=1, pady=10)

    label = Label(window, text="Website")
    label.grid(row=2, column=0, padx=80)

    label = Label(window, text="Username")
    label.grid(row=2, column=1, padx=80)

    label = Label(window, text="Password")
    label.grid(row=2, column=2, padx=80)

    cursor.execute("SELECT * FROM passVault")
    if (cursor.fetchall() != None):
        i = 0
        while True:

            cursor.execute("SELECT * FROM passVault")
            array = cursor.fetchall()

            if (len(array)==0):
                break

            label1 = Label(window, text=(decrypt(array[i][1], encryptionKey)), font=('Times New Roman', 12))
            label1.grid(column=0, row=i+3)
            label2 = Label(window, text=(decrypt(array[i][2], encryptionKey)), font=('Times New Roman', 12))
            label2.grid(column=1, row=i+3)
            label3 = Label(window, text=(decrypt(array[i][3], encryptionKey)), font=('Times New Roman', 12))
            label3.grid(column=2, row=i+3)

            button = Button(window, text="Delete", command=partial(delEntry, array[i][0]))
            button.grid(column=3, row=i+3, pady=10)

            i=i+1

            cursor.execute("SELECT * FROM passVault")

            if(len(cursor.fetchall())<=i):
                break


cursor.execute("SELECT * FROM masterpassword")
if cursor.fetchall():
    loginScreen()
else:
    firstScreen()

window.mainloop()