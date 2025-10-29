'''
Business: Handles user authentication, registration by admin, and profile management
Args: event with httpMethod, body, headers
Returns: HTTP response with auth tokens and user data
'''

import json
import os
import hashlib
import psycopg2
from typing import Dict, Any, Optional
from datetime import datetime

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'login':
                username = body_data.get('username')
                password = body_data.get('password')
                password_hash = hash_password(password)
                
                cur.execute('''
                    SELECT id, username, display_name, first_name, last_name, 
                           avatar_url, is_admin, is_verified, is_friend_of_admin
                    FROM users 
                    WHERE username = %s AND password_hash = %s
                ''', (username, password_hash))
                
                user = cur.fetchone()
                
                if user:
                    cur.execute('''
                        UPDATE users SET last_seen = CURRENT_TIMESTAMP 
                        WHERE id = %s
                    ''', (user[0],))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({
                            'success': True,
                            'user': {
                                'id': user[0],
                                'username': user[1],
                                'display_name': user[2],
                                'first_name': user[3],
                                'last_name': user[4],
                                'avatar_url': user[5],
                                'is_admin': user[6],
                                'is_verified': user[7],
                                'is_friend_of_admin': user[8]
                            }
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 401,
                        'headers': headers,
                        'body': json.dumps({'success': False, 'error': 'Неверный логин или пароль'}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'register':
                admin_id = body_data.get('admin_id')
                username = body_data.get('username')
                password = body_data.get('password')
                is_friend = body_data.get('is_friend_of_admin', False)
                
                cur.execute('SELECT is_admin FROM users WHERE id = %s', (admin_id,))
                admin = cur.fetchone()
                
                if not admin or not admin[0]:
                    return {
                        'statusCode': 403,
                        'headers': headers,
                        'body': json.dumps({'success': False, 'error': 'Только администратор может создавать пользователей'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                
                cur.execute('''
                    INSERT INTO users (username, password_hash, is_friend_of_admin)
                    VALUES (%s, %s, %s)
                    RETURNING id, username
                ''', (username, password_hash, is_friend))
                
                new_user = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'user': {
                            'id': new_user[0],
                            'username': new_user[1]
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'update_profile':
                user_id = body_data.get('user_id')
                first_name = body_data.get('first_name')
                last_name = body_data.get('last_name')
                display_name = body_data.get('display_name')
                avatar_url = body_data.get('avatar_url')
                
                cur.execute('''
                    UPDATE users 
                    SET first_name = %s, last_name = %s, display_name = %s, avatar_url = %s
                    WHERE id = %s
                    RETURNING id, username, display_name, first_name, last_name, avatar_url
                ''', (first_name, last_name, display_name, avatar_url, user_id))
                
                updated_user = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'user': {
                            'id': updated_user[0],
                            'username': updated_user[1],
                            'display_name': updated_user[2],
                            'first_name': updated_user[3],
                            'last_name': updated_user[4],
                            'avatar_url': updated_user[5]
                        }
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            user_id = event.get('queryStringParameters', {}).get('user_id')
            
            if user_id:
                cur.execute('''
                    SELECT id, username, display_name, first_name, last_name, 
                           avatar_url, is_admin, is_verified, is_friend_of_admin,
                           status_visibility, last_seen
                    FROM users WHERE id = %s
                ''', (user_id,))
                
                user = cur.fetchone()
                
                if user:
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({
                            'success': True,
                            'user': {
                                'id': user[0],
                                'username': user[1],
                                'display_name': user[2],
                                'first_name': user[3],
                                'last_name': user[4],
                                'avatar_url': user[5],
                                'is_admin': user[6],
                                'is_verified': user[7],
                                'is_friend_of_admin': user[8],
                                'status_visibility': user[9],
                                'last_seen': user[10].isoformat() if user[10] else None
                            }
                        }),
                        'isBase64Encoded': False
                    }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'success': False, 'error': 'Неверный запрос'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
