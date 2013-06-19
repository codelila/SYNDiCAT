module.exports = 
  { "development":
    { "driver":   "sqlite3",
      "database": "var/development.sqlite3"
    }
  , "test":
    { "driver":   "memory"
    }
  , "production":
    { "driver":   "memory"
    }
  };
