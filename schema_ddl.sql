CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100),
    age INT,
    gender VARCHAR(20),
    bio TEXT,
    interests TEXT[],
    location GEOMETRY(Point, 4326), -- Geolocation for nearby matches
    profile_pictures TEXT[]
);

CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    user_1 INT REFERENCES users(id) ON DELETE CASCADE,
    user_2 INT REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(10) CHECK (status IN ('pending', 'matched', 'blocked')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW()
);
