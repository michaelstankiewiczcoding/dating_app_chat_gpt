SELECT * FROM profiles
WHERE ST_Distance(location, ST_GeomFromText('POINT(40.7128 -74.0060)', 4326)) < 5000
AND gender = 'female'
AND age BETWEEN 25 AND 30;
