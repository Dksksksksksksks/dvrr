from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import json
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dvr-community-secret-key-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dvr_community.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Admin credentials
ADMIN_EMAIL = "dvr24121@gmail.com"
ADMIN_PASSWORD = "196719285drfxkgjaif8"

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=True)
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    avatar = db.Column(db.String(256), default='default')
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    high_scores = db.relationship('HighScore', backref='user', lazy=True)

class HighScore(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    game_name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SiteSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(50), unique=True, nullable=False)
    setting_value = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TeamMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(50), default='fa-user')
    order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Create tables and initialize default data
with app.app_context():
    db.create_all()
    
    # Initialize default settings
    if not SiteSettings.query.filter_by(setting_key='discord_link').first():
        db.session.add(SiteSettings(setting_key='discord_link', setting_value='https://discord.gg/dvr'))
    if not SiteSettings.query.filter_by(setting_key='site_name').first():
        db.session.add(SiteSettings(setting_key='site_name', setting_value='DVR COMMUNITY'))
    if not SiteSettings.query.filter_by(setting_key='welcome_message').first():
        db.session.add(SiteSettings(setting_key='welcome_message', setting_value='Your gateway to epic gaming experiences and an amazing community'))
    if not SiteSettings.query.filter_by(setting_key='maintenance_mode').first():
        db.session.add(SiteSettings(setting_key='maintenance_mode', setting_value='false'))
    
    # Initialize default team members
    if not TeamMember.query.first():
        default_team = [
            TeamMember(name='M7 DVR', role='OWNER', icon='fa-crown', order=1),
            TeamMember(name='bin Abdullah', role='OWNER', icon='fa-code', order=2),
            TeamMember(name='Dr.DrFx', role='CO OWNER & DEVELOPER', icon='fa-terminal', order=3),
            TeamMember(name='Mutlaq', role='Co Owner', icon='fa-star', order=4),
            TeamMember(name='Saif', role='Co Owner', icon='fa-star', order=5),
            TeamMember(name='Rakan', role='FOUNDER', icon='fa-star', order=6),
        ]
        for member in default_team:
            db.session.add(member)
    
    db.session.commit()

# Helper functions
def get_setting(key, default=''):
    setting = SiteSettings.query.filter_by(setting_key=key).first()
    return setting.setting_value if setting else default

def set_setting(key, value):
    setting = SiteSettings.query.filter_by(setting_key=key).first()
    if setting:
        setting.setting_value = value
    else:
        setting = SiteSettings(setting_key=key, setting_value=value)
        db.session.add(setting)
    db.session.commit()

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('index'))
        user = User.query.get(session['user_id'])
        if not user or not user.is_admin:
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already exists'})
    
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Username already exists'})
    
    # Check if admin account
    is_admin = (email == ADMIN_EMAIL and password == ADMIN_PASSWORD)
    
    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        is_admin=is_admin
    )
    
    db.session.add(user)
    db.session.commit()
    
    session['user_id'] = user.id
    session['username'] = user.username
    session['is_admin'] = user.is_admin
    
    return jsonify({'success': True, 'message': 'Account created successfully!'})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # Check for admin login
    if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(
                username='DVR_Admin',
                email=ADMIN_EMAIL,
                password_hash=generate_password_hash(ADMIN_PASSWORD),
                is_admin=True
            )
            db.session.add(user)
            db.session.commit()
        
        session['user_id'] = user.id
        session['username'] = user.username
        session['is_admin'] = True
        return jsonify({'success': True, 'message': 'Welcome Admin!', 'is_admin': True})
    
    user = User.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.password_hash, password):
        session['user_id'] = user.id
        session['username'] = user.username
        session['is_admin'] = user.is_admin
        return jsonify({'success': True, 'message': 'Login successful!'})
    
    return jsonify({'success': False, 'message': 'Invalid email or password'})

@app.route('/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    google_id = data.get('google_id')
    email = data.get('email')
    name = data.get('name')
    avatar = data.get('avatar')
    
    user = User.query.filter_by(google_id=google_id).first()
    
    if not user:
        user = User.query.filter_by(email=email).first()
        if user:
            user.google_id = google_id
        else:
            user = User(
                username=name,
                email=email,
                google_id=google_id,
                avatar=avatar
            )
            db.session.add(user)
    
    db.session.commit()
    
    session['user_id'] = user.id
    session['username'] = user.username
    session['is_admin'] = user.is_admin
    
    return jsonify({'success': True, 'message': 'Google login successful!'})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    user = User.query.get(session['user_id'])
    settings = {
        'discord_link': get_setting('discord_link', 'https://discord.gg/dvr'),
        'site_name': get_setting('site_name', 'DVR COMMUNITY'),
        'welcome_message': get_setting('welcome_message', 'Your gateway to epic gaming experiences'),
        'maintenance_mode': get_setting('maintenance_mode', 'false')
    }
    team_members = TeamMember.query.filter_by(is_active=True).order_by(TeamMember.order).all()
    return render_template('dashboard.html', user=user, settings=settings, team_members=team_members)

@app.route('/api/settings', methods=['GET'])
@login_required
def get_settings():
    settings = {
        'discord_link': get_setting('discord_link', 'https://discord.gg/dvr'),
        'site_name': get_setting('site_name', 'DVR COMMUNITY'),
        'welcome_message': get_setting('welcome_message', 'Your gateway to epic gaming experiences'),
        'maintenance_mode': get_setting('maintenance_mode', 'false')
    }
    return jsonify(settings)

@app.route('/api/settings', methods=['POST'])
@admin_required
def update_settings():
    data = request.get_json()
    
    for key, value in data.items():
        set_setting(key, value)
    
    return jsonify({'success': True, 'message': 'Settings updated successfully!'})

@app.route('/api/team', methods=['GET'])
def get_team():
    team_members = TeamMember.query.filter_by(is_active=True).order_by(TeamMember.order).all()
    return jsonify([{
        'id': m.id,
        'name': m.name,
        'role': m.role,
        'icon': m.icon,
        'order': m.order
    } for m in team_members])

@app.route('/api/team', methods=['POST'])
@admin_required
def add_team_member():
    data = request.get_json()
    
    member = TeamMember(
        name=data.get('name'),
        role=data.get('role'),
        icon=data.get('icon', 'fa-user'),
        order=data.get('order', 0)
    )
    
    db.session.add(member)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Team member added!', 'id': member.id})

@app.route('/api/team/<int:member_id>', methods=['PUT'])
@admin_required
def update_team_member(member_id):
    data = request.get_json()
    member = TeamMember.query.get(member_id)
    
    if not member:
        return jsonify({'success': False, 'message': 'Member not found'}), 404
    
    member.name = data.get('name', member.name)
    member.role = data.get('role', member.role)
    member.icon = data.get('icon', member.icon)
    member.order = data.get('order', member.order)
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Team member updated!'})

@app.route('/api/team/<int:member_id>', methods=['DELETE'])
@admin_required
def delete_team_member(member_id):
    member = TeamMember.query.get(member_id)
    
    if not member:
        return jsonify({'success': False, 'message': 'Member not found'}), 404
    
    member.is_active = False
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Team member removed!'})

@app.route('/api/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'is_admin': u.is_admin,
        'created_at': u.created_at.isoformat()
    } for u in users])

@app.route('/api/users/<int:user_id>/toggle-admin', methods=['POST'])
@admin_required
def toggle_admin(user_id):
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    if user.email == ADMIN_EMAIL:
        return jsonify({'success': False, 'message': 'Cannot modify main admin'}), 403
    
    user.is_admin = not user.is_admin
    db.session.commit()
    
    return jsonify({'success': True, 'message': f'Admin status {"granted" if user.is_admin else "revoked"}!'})

@app.route('/save-score', methods=['POST'])
@login_required
def save_score():
    data = request.get_json()
    game_name = data.get('game_name')
    score = data.get('score')
    
    high_score = HighScore.query.filter_by(
        user_id=session['user_id'],
        game_name=game_name
    ).first()
    
    if high_score:
        if score > high_score.score:
            high_score.score = score
    else:
        high_score = HighScore(
            user_id=session['user_id'],
            game_name=game_name,
            score=score
        )
        db.session.add(high_score)
    
    db.session.commit()
    return jsonify({'success': True})

@app.route('/get-leaderboard/<game_name>')
def get_leaderboard(game_name):
    scores = HighScore.query.filter_by(game_name=game_name)\
        .order_by(HighScore.score.desc())\
        .limit(10)\
        .all()
    
    leaderboard = []
    for score in scores:
        leaderboard.append({
            'username': score.user.username,
            'score': score.score
        })
    
    return jsonify(leaderboard)

@app.route('/api/stats')
@admin_required
def get_stats():
    total_users = User.query.count()
    total_games = HighScore.query.count()
    
    return jsonify({
        'total_users': total_users,
        'total_games': total_games
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)