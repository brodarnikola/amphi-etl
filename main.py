import subprocess
import sys
import argparse
import os

from flask import Flask, render_template, redirect, url_for, request
from flask_login import login_required, current_user
from .auth import init_auth, User, db, login_user, logout_user

app = Flask(__name__)
init_auth(app)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form['username']).first()
        if user and user.password == request.form['password']:
            login_user(user)
            return redirect(url_for('main_app'))
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        user = User(username=request.form['username'], password=request.form['password'])
        db.session.add(user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@login_required
def main_app():
    return redirect(url_for('jupyter_app'))

def main():
    parser = argparse.ArgumentParser(description='Amphi ETL Command Line Interface')
    parser.add_argument('command', choices=['start'], help='Command to start Amphi ETL')
    parser.add_argument('-w', '--workspace', default='.', help='Workspace directory for Amphi ETL')
    parser.add_argument('-p', '--port', type=int, default=8888, help='Port for Amphi ETL')
    parser.add_argument('-i', '--ip', default='localhost', help='IP address for Amphi ETL')

    args = parser.parse_args()

    # Debugging logs
    print(f"Received command: {args.command}")
    print(f"Workspace directory: {args.workspace}")
    print(f"Port: {args.port}")
    print(f"IP: {args.ip}")
    print(f"Python executable: {sys.executable}")
    print(f"Environment PATH: {os.environ.get('PATH')}")

    if args.command == 'start':
        jupyter_command = [
            sys.executable, '-m', 'jupyter', 'lab', 
            f'--notebook-dir={args.workspace}', f'--port={args.port}', f'--ip={args.ip}', '--ContentManager.allow_hidden=true'
        ]
        print(f"Running JupyterLab command: {' '.join(jupyter_command)}")
        try:
            subprocess.check_call(jupyter_command)
        except subprocess.CalledProcessError as e:
            print(f"Failed to start Amphi: {e}")

if __name__ == '__main__':
    main()