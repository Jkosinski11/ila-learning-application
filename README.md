# CS-430-Group-8
A gamified financial literacy platform for students that uses simulated money and real market data to teach long term investing behavior in a classroom managed environment.

## Authentication
The app suports three account types:
STUDENT- Registers with email, passowrd, first name, last name, and a classcode
TEACHER - Registers with email, password, first name, last name, classcode and a secret teach registration code.
ADMIN - Registers with email, password, first name, last name, and a secret admin registration code.

Teacher and Administrator registration requires a secret code.
These are stored int `backend/server.js` as `REGISTRATION_CODES` for now.

## Valid Class Codes
Current hardcoded classcodes are: UHS001, UHS002, UHS003,