import logging
import socket
import time
from urllib.parse import urlparse
from typing import Any, Dict, List, Optional
from neo4j import GraphDatabase, Driver, Session
from neo4j.exceptions import ServiceUnavailable, AuthError, Neo4jError
from app.core.config import settings

logger = logging.getLogger("atmograph.database")


class Neo4jConnectionError(Exception):
    """Raised when connecting or querying Neo4j fails."""
    pass


class Neo4jDatabase:
    _instance: Optional["Neo4jDatabase"] = None
    _driver: Optional[Driver] = None
    _last_check_time: float = 0.0
    _last_check_status: bool = False
    _check_cache_ttl: float = 2.0  # cache connection health for 2 seconds

    def __new__(cls) -> "Neo4jDatabase":
        if cls._instance is None:
            cls._instance = super(Neo4jDatabase, cls).__new__(cls)
        return cls._instance

    @staticmethod
    def _is_port_open(uri: str, timeout: float = 0.8) -> bool:
        """Fast TCP socket ping to check if Neo4j port is listening."""
        try:
            parsed = urlparse(uri)
            host = parsed.hostname or "localhost"
            port = parsed.port or 7687
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(timeout)
                s.connect((host, port))
            return True
        except (socket.error, socket.timeout, Exception):
            return False

    def connect(self) -> Optional[Driver]:
        """Initialize Neo4j driver connection pool if port is open."""
        if self._driver is None:
            if not self._is_port_open(settings.NEO4J_URI):
                logger.warning(f"Neo4j port is not open at {settings.NEO4J_URI}.")
                self._last_check_status = False
                self._last_check_time = time.time()
                return None

            try:
                logger.info(f"Connecting to Neo4j at {settings.NEO4J_URI} (user={settings.NEO4J_USERNAME})...")
                self._driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD),
                    max_connection_lifetime=3600,
                    max_connection_pool_size=50,
                    connection_acquisition_timeout=2.0,
                )
                self._driver.verify_connectivity()
                self._last_check_status = True
                self._last_check_time = time.time()
                logger.info("Successfully connected and verified Neo4j connection.")
            except (ServiceUnavailable, AuthError, Neo4jError, Exception) as e:
                logger.warning(f"Neo4j connection verification failed: {e}")
                self._driver = None
                self._last_check_status = False
                self._last_check_time = time.time()
        return self._driver

    def close(self) -> None:
        """Close Neo4j driver connection pool."""
        if self._driver is not None:
            try:
                self._driver.close()
                logger.info("Neo4j driver connection closed.")
            except Exception as e:
                logger.error(f"Error closing Neo4j driver: {e}")
            finally:
                self._driver = None
                self._last_check_status = False

    def is_connected(self) -> bool:
        """Checks if Neo4j is actively reachable using fast socket check + driver verification."""
        now = time.time()
        if (now - self._last_check_time) < self._check_cache_ttl:
            return self._last_check_status

        if not self._is_port_open(settings.NEO4J_URI):
            self._last_check_status = False
            self._last_check_time = now
            return False

        if self._driver is None:
            self.connect()

        if self._driver is None:
            self._last_check_status = False
            self._last_check_time = now
            return False

        try:
            self._driver.verify_connectivity()
            self._last_check_status = True
        except Exception:
            self._last_check_status = False

        self._last_check_time = now
        return self._last_check_status

    def get_session(self, access_mode: Optional[str] = None) -> Session:
        """Provides a database session with error handling."""
        if not self.is_connected():
            raise Neo4jConnectionError(
                f"Cannot connect to Neo4j instance at {settings.NEO4J_URI}. Ensure Neo4j service is running."
            )
        return self._driver.session(
            database=settings.NEO4J_DATABASE,
            default_access_mode=access_mode
        )

    def execute_read(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Executes a read query and returns list of dictionaries."""
        with self.get_session() as session:
            result = session.run(query, parameters or {})
            return [dict(record) for record in result]

    def execute_write(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Executes a write query and returns list of dictionaries."""
        with self.get_session() as session:
            result = session.run(query, parameters or {})
            return [dict(record) for record in result]


# Global singleton instance
db = Neo4jDatabase()
