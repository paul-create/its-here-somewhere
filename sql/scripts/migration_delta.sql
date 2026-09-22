Traceback (most recent call last):
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/schemainspect/misc.py", line 9, in connection_from_s_or_c
    s_or_c.engine
AttributeError: 'Session' object has no attribute 'engine'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 144, in __init__
    self._dbapi_connection = engine.raw_connection()
                             ^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 3319, in raw_connection
    return self.pool.connect()
           ^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 448, in connect
    return _ConnectionFairy._checkout(self)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 1290, in _checkout
    fairy = _ConnectionRecord.checkout(pool)
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 712, in checkout
    rec = pool._do_get()
          ^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/impl.py", line 178, in _do_get
    with util.safe_reraise():
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/util/langhelpers.py", line 122, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/impl.py", line 176, in _do_get
    return self._create_connection()
           ^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 389, in _create_connection
    return _ConnectionRecord(self)
           ^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 674, in __init__
    self.__connect()
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 900, in __connect
    with util.safe_reraise():
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/util/langhelpers.py", line 122, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 896, in __connect
    self.dbapi_connection = connection = pool._invoke_creator(self)
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/engine/create.py", line 667, in connect
    return dialect.connect(*cargs_tup, **cparams)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 630, in connect
    return self.loaded_dbapi.connect(*cargs, **cparams)  # type: ignore[no-any-return]  # NOQA: E501
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/psycopg2/__init__.py", line 122, in connect
    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
psycopg2.OperationalError: connection to server at "its-here-somewhere-postgres.chqokc88qwim.eu-west-2.rds.amazonaws.com" (35.176.189.64), port 5432 failed: FATAL:  password authentication failed for user "postgresql"
connection to server at "its-here-somewhere-postgres.chqokc88qwim.eu-west-2.rds.amazonaws.com" (35.176.189.64), port 5432 failed: FATAL:  no pg_hba.conf entry for host "172.171.107.83", user "postgresql", database "its_here_somewhere", no encryption


The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/opt/hostedtoolcache/Python/3.11.16/x64/bin/migra", line 6, in <module>
    sys.exit(do_command())
             ^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/migra/command.py", line 121, in do_command
    status = run(args)
             ^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/migra/command.py", line 86, in run
    m = Migration(
        ^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/migra/migra.py", line 31, in __init__
    self.changes.i_from = get_inspector(
                          ^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/schemainspect/get.py", line 14, in get_inspector
    c = connection_from_s_or_c(x)
        ^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/schemainspect/misc.py", line 14, in connection_from_s_or_c
    return s_or_c.connection()
           ^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 2097, in connection
    return self._connection_for_bind(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 2113, in _connection_for_bind
    return trans._connection_for_bind(engine, execution_options)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<string>", line 2, in _connection_for_bind
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/orm/state_changes.py", line 137, in _go
    ret_value = fn(self, *arg, **kw)
                ^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/orm/session.py", line 1191, in _connection_for_bind
    conn = bind.connect()
           ^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 3295, in connect
    return self._connection_cls(self)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 146, in __init__
    Connection._handle_dbapi_exception_noconnection(
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 2450, in _handle_dbapi_exception_noconnection
    raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 144, in __init__
    self._dbapi_connection = engine.raw_connection()
                             ^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/engine/base.py", line 3319, in raw_connection
    return self.pool.connect()
           ^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 448, in connect
    return _ConnectionFairy._checkout(self)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 1290, in _checkout
    fairy = _ConnectionRecord.checkout(pool)
            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 712, in checkout
    rec = pool._do_get()
          ^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/impl.py", line 178, in _do_get
    with util.safe_reraise():
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/util/langhelpers.py", line 122, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/impl.py", line 176, in _do_get
    return self._create_connection()
           ^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 389, in _create_connection
    return _ConnectionRecord(self)
           ^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 674, in __init__
    self.__connect()
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 900, in __connect
    with util.safe_reraise():
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/util/langhelpers.py", line 122, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/pool/base.py", line 896, in __connect
    self.dbapi_connection = connection = pool._invoke_creator(self)
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/engine/create.py", line 667, in connect
    return dialect.connect(*cargs_tup, **cparams)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/sqlalchemy/engine/default.py", line 630, in connect
    return self.loaded_dbapi.connect(*cargs, **cparams)  # type: ignore[no-any-return]  # NOQA: E501
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/opt/hostedtoolcache/Python/3.11.16/x64/lib/python3.11/site-packages/psycopg2/__init__.py", line 122, in connect
    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) connection to server at "its-here-somewhere-postgres.chqokc88qwim.eu-west-2.rds.amazonaws.com" (35.176.189.64), port 5432 failed: FATAL:  password authentication failed for user "postgresql"
connection to server at "its-here-somewhere-postgres.chqokc88qwim.eu-west-2.rds.amazonaws.com" (35.176.189.64), port 5432 failed: FATAL:  no pg_hba.conf entry for host "172.171.107.83", user "postgresql", database "its_here_somewhere", no encryption

(Background on this error at: https://sqlalche.me/e/20/e3q8)
