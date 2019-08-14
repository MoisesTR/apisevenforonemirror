db.users.insertOne({
    firstName: 'Test2',
    lastName: 'Test2',
    userName: 'Test2',
    email: 'tes2t@gmail.com',
    passwordHash: '$2a$10$CznKV0bofGnp5vsp7MRvIu64piWuSiLdtq55wpZ4k9f0msxLPzKbq',
    role: ObjectId('5cda490dd93504c8cd0687f6'),
    isVerified: true,
    secretToken: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    enabled: true,
});
