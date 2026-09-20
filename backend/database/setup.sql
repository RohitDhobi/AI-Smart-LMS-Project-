CREATE DATABASE IF NOT EXISTS ai_smart_lms;
USE ai_smart_lms;
-- Tables are created/updated automatically by Hibernate (spring.jpa.hibernate.ddl-auto=update).
--
-- On first startup the application automatically seeds (DataSeeder):
--   * 10 degree programs: BCA, MCA, BBA, MBA, B.Com, M.Com, BA, MA, B.Sc, M.Sc
--   * All subjects for BCA, MCA, BBA, MBA, B.Com and M.Com (per semester)
--   * Starter lessons for every seeded subject
--   * A default admin account (admin@example.com / admin123)
--
-- To promote a manually registered account instead:
-- UPDATE users SET role='ADMIN' WHERE email='admin@example.com';
-- UPDATE users SET role='INSTRUCTOR' WHERE email='instructor@example.com';
