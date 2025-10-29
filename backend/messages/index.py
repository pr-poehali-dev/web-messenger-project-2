'''
Business: Handles chat messages, contacts, and real-time messaging features
Args: event with httpMethod, body, queryStringParameters
Returns: HTTP response with messages, contacts, and chat data
'''

import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime, timedelta

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
            
            if action == 'send_message':
                chat_id = body_data.get('chat_id')
                sender_id = body_data.get('sender_id')
                content = body_data.get('content')
                message_type = body_data.get('message_type', 'text')
                file_url = body_data.get('file_url')
                file_name = body_data.get('file_name')
                
                cur.execute('''
                    INSERT INTO messages (chat_id, sender_id, content, message_type, file_url, file_name)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, chat_id, sender_id, content, message_type, file_url, file_name, created_at
                ''', (chat_id, sender_id, content, message_type, file_url, file_name))
                
                message = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'message': {
                            'id': message[0],
                            'chat_id': message[1],
                            'sender_id': message[2],
                            'content': message[3],
                            'message_type': message[4],
                            'file_url': message[5],
                            'file_name': message[6],
                            'created_at': message[7].isoformat()
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'add_contact':
                user_id = body_data.get('user_id')
                contact_username = body_data.get('contact_username')
                custom_name = body_data.get('custom_name')
                
                cur.execute('SELECT id FROM users WHERE username = %s', (contact_username,))
                contact_user = cur.fetchone()
                
                if not contact_user:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'success': False, 'error': 'Пользователь не найден'}),
                        'isBase64Encoded': False
                    }
                
                contact_user_id = contact_user[0]
                
                cur.execute('''
                    INSERT INTO contacts (user_id, contact_user_id, custom_name)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id, contact_user_id) DO NOTHING
                    RETURNING id
                ''', (user_id, contact_user_id, custom_name))
                
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'contact_user_id': contact_user_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'create_chat':
                user1_id = body_data.get('user1_id')
                user2_id = body_data.get('user2_id')
                
                cur.execute('''
                    SELECT id FROM chats 
                    WHERE (user1_id = %s AND user2_id = %s) 
                       OR (user1_id = %s AND user2_id = %s)
                ''', (user1_id, user2_id, user2_id, user1_id))
                
                existing_chat = cur.fetchone()
                
                if existing_chat:
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True, 'chat_id': existing_chat[0]}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('''
                    INSERT INTO chats (user1_id, user2_id)
                    VALUES (%s, %s)
                    RETURNING id
                ''', (user1_id, user2_id))
                
                chat_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'chat_id': chat_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'set_typing':
                chat_id = body_data.get('chat_id')
                user_id = body_data.get('user_id')
                
                cur.execute('''
                    INSERT INTO typing_indicators (chat_id, user_id, last_typing)
                    VALUES (%s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (chat_id, user_id) 
                    DO UPDATE SET last_typing = CURRENT_TIMESTAMP
                ''', (chat_id, user_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {})
            action = params.get('action')
            
            if action == 'get_messages':
                chat_id = params.get('chat_id')
                
                cur.execute('''
                    SELECT m.id, m.chat_id, m.sender_id, m.content, m.message_type, 
                           m.file_url, m.file_name, m.created_at, u.display_name, u.avatar_url
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                ''', (chat_id,))
                
                messages = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'messages': [{
                            'id': msg[0],
                            'chat_id': msg[1],
                            'sender_id': msg[2],
                            'content': msg[3],
                            'message_type': msg[4],
                            'file_url': msg[5],
                            'file_name': msg[6],
                            'created_at': msg[7].isoformat(),
                            'sender_name': msg[8],
                            'sender_avatar': msg[9]
                        } for msg in messages]
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'get_contacts':
                user_id = params.get('user_id')
                
                cur.execute('''
                    SELECT c.id, c.contact_user_id, c.custom_name, 
                           u.username, u.display_name, u.avatar_url, 
                           u.is_verified, u.is_friend_of_admin, u.last_seen, u.status_visibility
                    FROM contacts c
                    JOIN users u ON c.contact_user_id = u.id
                    WHERE c.user_id = %s
                    ORDER BY c.added_at DESC
                ''', (user_id,))
                
                contacts = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'contacts': [{
                            'id': cont[0],
                            'user_id': cont[1],
                            'custom_name': cont[2],
                            'username': cont[3],
                            'display_name': cont[4],
                            'avatar_url': cont[5],
                            'is_verified': cont[6],
                            'is_friend_of_admin': cont[7],
                            'last_seen': cont[8].isoformat() if cont[8] else None,
                            'status_visibility': cont[9]
                        } for cont in contacts]
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'get_chats':
                user_id = params.get('user_id')
                
                cur.execute('''
                    SELECT DISTINCT c.id, 
                           CASE WHEN c.user1_id = %s THEN c.user2_id ELSE c.user1_id END as other_user_id,
                           u.username, u.display_name, u.avatar_url,
                           (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                           (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time
                    FROM chats c
                    JOIN users u ON (CASE WHEN c.user1_id = %s THEN c.user2_id ELSE c.user1_id END) = u.id
                    WHERE c.user1_id = %s OR c.user2_id = %s
                    ORDER BY last_message_time DESC NULLS LAST
                ''', (user_id, user_id, user_id, user_id))
                
                chats = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'chats': [{
                            'chat_id': chat[0],
                            'other_user_id': chat[1],
                            'username': chat[2],
                            'display_name': chat[3],
                            'avatar_url': chat[4],
                            'last_message': chat[5],
                            'last_message_time': chat[6].isoformat() if chat[6] else None
                        } for chat in chats]
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'is_typing':
                chat_id = params.get('chat_id')
                user_id = params.get('user_id')
                
                cur.execute('''
                    SELECT user_id FROM typing_indicators 
                    WHERE chat_id = %s 
                      AND user_id != %s 
                      AND last_typing > (CURRENT_TIMESTAMP - INTERVAL '3 seconds')
                ''', (chat_id, user_id))
                
                typing_user = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'is_typing': typing_user is not None
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
