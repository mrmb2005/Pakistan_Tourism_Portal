import mysql.connector
from mysql.connector import Error
import logging
from config import DB_CONFIG

logger = logging.getLogger(__name__)

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            return connection
    except Error as e:
        logger.error(f"Error connecting to MySQL: {e}")
        raise
    return None

def execute_query(query, params=None, fetch=False, fetch_one=False):
    """
    Execute a query and return results
    
    Args:
        query: SQL query string
        params: Query parameters (tuple or dict)
        fetch: Whether to fetch results (SELECT queries)
        fetch_one: Whether to fetch only one result
    
    Returns:
        For SELECT: list of dictionaries or single dictionary
        For INSERT/UPDATE/DELETE: number of affected rows
    """
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        
        cursor.execute(query, params or ())
        
        if fetch:
            if fetch_one:
                result = cursor.fetchone()
            else:
                result = cursor.fetchall()
            return result
        else:
            connection.commit()
            return cursor.rowcount
            
    except Error as e:
        logger.error(f"Database error: {e}")
        if connection:
            connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

def get_last_insert_id():
    """Get the last inserted ID"""
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT LAST_INSERT_ID()")
        result = cursor.fetchone()
        return result[0] if result else None
    except Error as e:
        logger.error(f"Error getting last insert ID: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

def test_db_connection():
    """
    Test database connection and return connection details
    
    Returns:
        dict: Connection status and details
    """
    try:
        connection = get_db_connection()
        if connection.is_connected():
            db_info = connection.get_server_info()
            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE()")
            db_name = cursor.fetchone()[0]
            cursor.close()
            connection.close()
            
            return {
                'status': 'success',
                'connected': True,
                'mysql_version': db_info,
                'database': db_name,
                'host': DB_CONFIG['host'],
                'user': DB_CONFIG['user']
            }
    except Error as e:
        return {
            'status': 'failed',
            'connected': False,
            'error': str(e),
            'host': DB_CONFIG.get('host', 'unknown'),
            'database': DB_CONFIG.get('database', 'unknown')
        }
    except Exception as e:
        return {
            'status': 'failed',
            'connected': False,
            'error': str(e),
            'message': 'Unexpected error during connection test'
        }
    

    
if __name__ == "__main__":
    conn = get_db_connection()
    print("CONNECTED SUCCESSFULLY")


