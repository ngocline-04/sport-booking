-- ========================
-- Table: field_types
-- ========================
CREATE TABLE field_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Table: sport_types
-- ========================
CREATE TABLE sport_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Table: locations
-- ========================
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Table: fields
-- ========================
CREATE TABLE fields (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact VARCHAR(100),
    description TEXT,
    open TIME NOT NULL,
    close TIME NOT NULL,
    id_type_field INT REFERENCES field_types(id) ON DELETE SET NULL,
    id_type_sport INT REFERENCES sport_types(id) ON DELETE SET NULL,
    id_location INT REFERENCES locations(id) ON DELETE SET NULL,
    amount_available INT DEFAULT 0 CHECK (amount_available >= 0),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available','unavailable')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Table: field_price
-- ========================
CREATE TABLE field_price (
    id SERIAL PRIMARY KEY,
    id_type_field INT NOT NULL REFERENCES field_types(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Table: schedules
-- ========================
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    time VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Table: schedule_for_field
-- ========================
CREATE TABLE schedule_for_field (
    id SERIAL PRIMARY KEY,
    id_schedule INT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    id_field INT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    id_type INT NOT NULL REFERENCES field_types(id) ON DELETE CASCADE,
    amount_available INT DEFAULT 0 CHECK (amount_available >= 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Enum types for booking
-- ========================
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid');

-- ========================
-- Table: users
-- ========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role_id INT REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Table: booking
-- ========================
CREATE TABLE booking (
    id SERIAL PRIMARY KEY,
    id_field INT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    time VARCHAR(20) NOT NULL,
    hour NUMERIC(4,2) NOT NULL,
    date DATE NOT NULL,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_approve INT REFERENCES users(id) ON DELETE SET NULL,
    id_schedule INT REFERENCES schedules(id) ON DELETE SET NULL,
    status booking_status DEFAULT 'pending',
    status_payment payment_status DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Table: roles
-- ========================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('ROLE_CUSTOMER','Khách hàng'),
('ROLE_ADMIN','Quản trị viên'),
('ROLE_CREATOR','Người tạo'),
('ROLE_APPROVER','Người phê duyệt');

-- ========================
-- Table: approvers
-- ========================
CREATE TABLE approvers (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Table: bill
-- ========================
CREATE TABLE bill (
    id SERIAL PRIMARY KEY,
    id_transaction VARCHAR(100) NOT NULL UNIQUE,
    id_booking INT NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
    time TIMESTAMP DEFAULT NOW(),
    user_received INT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- Trigger: calculate amount before inserting bill
-- ========================
CREATE OR REPLACE FUNCTION calculate_bill_amount()
RETURNS TRIGGER AS $$
DECLARE
    price NUMERIC(12,2);
    booking_hour NUMERIC(4,2);
    field_type_id INT;
    day_of_week INT;
BEGIN
    SELECT b.hour, f.id_type_field, EXTRACT(DOW FROM b.date)
    INTO booking_hour, field_type_id, day_of_week
    FROM booking b
    JOIN fields f ON b.id_field = f.id
    WHERE b.id = NEW.id_booking;

    SELECT price INTO price
    FROM field_price
    WHERE id_type_field = field_type_id
      AND day_of_week = day_of_week
      AND NEW.time::time BETWEEN start_time AND end_time
    LIMIT 1;

    NEW.amount := price * booking_hour;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_bill
BEFORE INSERT ON bill
FOR EACH ROW
EXECUTE FUNCTION calculate_bill_amount();
