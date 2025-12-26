const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const auth = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: การจัดการข้อมูลผู้ใช้งาน (CRUD)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้งานทั้งหมด
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายชื่อผู้ใช้งาน
 */
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        customer_id,
        firstname,
        fullname,
        lastname,
        username,
        address,
        phone,
        email,
        create_at
      FROM tbl_users
      `
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้งานตาม ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID ของผู้ใช้งาน (customer_id)
 *     responses:
 *       200:
 *         description: ข้อมูลผู้ใช้งาน
 *       404:
 *         description: ไม่พบผู้ใช้งาน
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        customer_id,
        firstname,
        fullname,
        lastname,
        username,
        address,
        phone,
        email,
        create_at
      FROM tbl_users
      WHERE customer_id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: เพิ่มผู้ใช้งานใหม่ (Admin Create)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - firstname
 *             properties:
 *               firstname:
 *                 type: string
 *               fullname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: เพิ่มผู้ใช้งานสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบ หรือ Username ซ้ำ
 */
router.post("/", auth, async (req, res) => {
  try {
    const {
      firstname,
      fullname,
      lastname,
      username,
      password,
      address,
      phone,
      email,
    } = req.body;

    if (!username || !password || !firstname) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
    }

    const [check] = await pool.query(
      "SELECT customer_id FROM tbl_users WHERE username = ?",
      [username]
    );

    if (check.length > 0) {
      return res.status(400).json({ message: "Username นี้มีผู้ใช้งานแล้ว" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `
      INSERT INTO tbl_users (
        firstname,
        fullname,
        lastname,
        username,
        password,
        address,
        phone,
        email,
        create_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        firstname,
        fullname,
        lastname,
        username,
        hashedPassword,
        address,
        phone,
        email,
      ]
    );

    res.json({
      message: "User created successfully",
      id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: แก้ไขข้อมูลผู้ใช้งาน
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstname:
 *                 type: string
 *               fullname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: อัปเดตข้อมูลสำเร็จ
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, fullname, lastname, address, phone, email } = req.body;

    const [result] = await pool.query(
      `
      UPDATE tbl_users
      SET
        firstname = ?,
        fullname  = ?,
        lastname  = ?,
        address   = ?,
        phone     = ?,
        email     = ?
      WHERE customer_id = ?
      `,
      [firstname, fullname, lastname, address, phone, email, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: ลบผู้ใช้งาน
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ลบข้อมูลสำเร็จ
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM tbl_users WHERE customer_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
