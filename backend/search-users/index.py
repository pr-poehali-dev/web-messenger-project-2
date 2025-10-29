'''
Business: Search users by username and add contacts
Args: event with httpMethod (GET for search, POST for add contact), queryStringParameters, body
Returns: HTTP response with user search results or contact add confirmation
'''

import json
import os
import psycopg2
from typing import Dict, Any, List

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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        query = params.get('q', '').strip()
        current_user_id = int(params.get('user_id', 0))
        
        if not query:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Query parameter q is required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            SELECT u.id, u.username, u.display_name, u.first_name, u.last_name, 
                   u.avatar_url, u.is_verified,
                   EXISTS(
                       SELECT 1 FROM t_p69961614_web_messenger_projec.contacts 
                       WHERE user_id = %s AND contact_user_id = u.id
                   ) as is_contact
            FROM t_p69961614_web_messenger_projec.users u
            WHERE u.username ILIKE %s AND u.id != %s
            ORDER BY u.is_verified DESC, u.username
            LIMIT 20
        ''', (current_user_id, f'%{query}%', current_user_id))
        
        results = []
        for row in cur.fetchall():
            results.append({
                'user_id': row[0],
                'username': row[1],
                'display_name': row[2] or row[1],
                'first_name': row[3],
                'last_name': row[4],
                'avatar_url': row[5],
                'is_verified': row[6],
                'is_contact': row[7]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'users': results}),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        current_user_id = body_data.get('user_id')
        target_user_id = body_data.get('target_user_id')
        
        if not current_user_id or not target_user_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'user_id and target_user_id are required'}),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            INSERT INTO t_p69961614_web_messenger_projec.contacts (user_id, contact_user_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            RETURNING id
        ''', (current_user_id, target_user_id))
        
        result = cur.fetchone()
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': 'Contact added successfully' if result else 'Contact already exists'
            }),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
