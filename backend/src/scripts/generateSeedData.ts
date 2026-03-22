import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// ─── IDs ──────────────────────────────────────────────────────────────────────
const ids = {
  // companies
  company1: '6501000000000000000000a1',
  company2: '6501000000000000000000a2',

  // users
  admin1:     '6501000000000000000000b1',
  manager1:   '6501000000000000000000b2',
  manager2:   '6501000000000000000000b3',
  manager3:   '6501000000000000000000b4',
  member1:    '6501000000000000000000b5',
  member2:    '6501000000000000000000b6',
  member3:    '6501000000000000000000b7',
  pending1:   '6501000000000000000000b8',

  // spaces
  space1: '6501000000000000000000c1',
  space2: '6501000000000000000000c2',
  space3: '6501000000000000000000c3',
  space4: '6501000000000000000000c4',
  space5: '6501000000000000000000c5',

  // elements (each space: open + 2 offices + 1 conf)
  el1_open: '6501000000000000000000d1',
  el1_off1: '6501000000000000000000d2',
  el1_off2: '6501000000000000000000d3',
  el1_conf: '6501000000000000000000d4',

  el2_open: '6501000000000000000000d5',
  el2_off1: '6501000000000000000000d6',
  el2_conf: '6501000000000000000000d7',

  el3_open: '6501000000000000000000d8',
  el3_conf: '6501000000000000000000d9',

  el4_open: '6501000000000000000000da',
  el4_off1: '6501000000000000000000db',

  el5_open: '6501000000000000000000dc',
  el5_conf: '6501000000000000000000dd',

  // reservations
  res1: '6501000000000000000000e1',
  res2: '6501000000000000000000e2',
  res3: '6501000000000000000000e3',
  res4: '6501000000000000000000e4',
  res5: '6501000000000000000000e5',
  res6: '6501000000000000000000e6',
  res7: '6501000000000000000000e7',
  res8: '6501000000000000000000e8',

  // reviews
  rev1: '6501000000000000000000f1',
  rev2: '6501000000000000000000f2',
  rev3: '6501000000000000000000f3',
};

function oid(id: string) { return { $oid: id }; }
function date(d: Date)   { return { $date: d.toISOString() }; }
function now()           { return date(new Date()); }

async function main() {
  const SALT = 10;
  const adminHash    = await bcrypt.hash('Admin@123',   SALT);
  const managerHash  = await bcrypt.hash('Manager@12',  SALT);
  const memberHash   = await bcrypt.hash('Member@123',  SALT);

  // ── companies ──────────────────────────────────────────────────────────────
  const companies = [
    {
      _id: oid(ids.company1),
      name: 'TechSpace Inc',
      address: 'Kneza Miloša 35, Beograd',
      registrationNumber: '12345678',
      taxId: '123456789',
      managerCount: 2,
    },
    {
      _id: oid(ids.company2),
      name: 'WorkHub Co',
      address: '42 Business Avenue, Novi Sad',
      registrationNumber: '87654321',
      taxId: '987654321',
      managerCount: 1,
    },
  ];

  // ── users ──────────────────────────────────────────────────────────────────
  const users = [
    {
      _id: oid(ids.admin1),
      username: 'admin',
      password: adminHash,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+381601234567',
      email: 'admin@coworking.com',
      profileImage: 'uploads/profiles/default.png',
      role: 'admin',
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: oid(ids.manager1),
      username: 'john.manager',
      password: managerHash,
      firstName: 'John',
      lastName: 'Smith',
      phone: '+381611234567',
      email: 'john.smith@techspace.com',
      profileImage: 'uploads/profiles/default.png',
      role: 'manager',
      status: 'active',
      companyId: oid(ids.company1),
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: oid(ids.manager2),
      username: 'sarah.manager',
      password: managerHash,
      firstName: 'Sarah',
      lastName: 'Connor',
      phone: '+381621234567',
      email: 'sarah.connor@techspace.com',
      profileImage: 'uploads/profiles/default.png',
      role: 'manager',
      status: 'active',
      companyId: oid(ids.company1),
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: oid(ids.manager3),
      username: 'mike.manager',
      password: managerHash,
      firstName: 'Mike',
      lastName: 'Johnson',
      phone: '+381631234567',
      email: 'mike.johnson@workhub.com',
      profileImage: 'uploads/profiles/default.png',
      role: 'manager',
      status: 'active',
      companyId: oid(ids.company2),
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: oid(ids.member1),
      username: 'alice',
      password: memberHash,
      firstName: 'Alice',
      lastName: 'Williams',
      phone: '+381641234567',
      email: 'alice@email.com',
      profileImage: 'uploads/profiles/default.png',
      role: 'member',
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: oid(ids.member2),
      username: 'bob',
      password: memberHash,
      firstName: 'Bob',
      lastName: 'Martinez',
      phone: '+381651234567',
      email: 'bob@email.com',
      profileImage: 'uploads/profiles/default.png',
      role: 'member',
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: oid(ids.member3),
      username: 'charlie',
      password: memberHash,
      firstName: 'Charlie',
      lastName: 'Brown',
      phone: '+381661234567',
      email: 'charlie@email.com',
      profileImage: 'uploads/profiles/default.png',
      role: 'member',
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: oid(ids.pending1),
      username: 'pending.user',
      password: memberHash,
      firstName: 'Pending',
      lastName: 'User',
      phone: '+381671234567',
      email: 'pending@email.com',
      profileImage: 'uploads/profiles/default.png',
      role: 'member',
      status: 'pending',
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  // ── spaces ─────────────────────────────────────────────────────────────────
  const spaces = [
    {
      _id: oid(ids.space1),
      name: 'TechSpace Belgrade Hub',
      city: 'Beograd',
      address: 'Kneza Miloša 35',
      description: 'A modern coworking hub in the heart of Belgrade. Open 24/7 with high-speed internet, ergonomic furniture and a vibrant startup community.',
      companyId: oid(ids.company1),
      managerId: oid(ids.manager1),
      pricePerHour: 5,
      status: 'active',
      mainImage: 'uploads/spaces/slika1.jpeg',
      images: ['uploads/spaces/slika2.jpeg', 'uploads/spaces/slika3.jpeg', 'uploads/spaces/slika4.jpeg'],
      latitude: 44.8043,
      longitude: 20.4617,
      maxPenalties: 3,
      totalLikes: 48,
      totalDislikes: 4,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: oid(ids.space2),
      name: 'TechSpace Novi Sad',
      city: 'Novi Sad',
      address: 'Trg slobode 8',
      description: 'Quiet and professional coworking space near the city center. Perfect for focused work and team meetings.',
      companyId: oid(ids.company1),
      managerId: oid(ids.manager2),
      pricePerHour: 4,
      status: 'active',
      mainImage: 'uploads/spaces/slika5.jpeg',
      images: ['uploads/spaces/slika6.jpeg', 'uploads/spaces/slika7.jpeg'],
      latitude: 45.2517,
      longitude: 19.8369,
      maxPenalties: 3,
      totalLikes: 35,
      totalDislikes: 2,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: oid(ids.space3),
      name: 'WorkHub Belgrade Central',
      city: 'Beograd',
      address: 'Makedonska 22',
      description: 'Premium coworking in central Belgrade. Includes fully equipped conference rooms, private offices and a rooftop terrace.',
      companyId: oid(ids.company2),
      managerId: oid(ids.manager3),
      pricePerHour: 8,
      status: 'active',
      mainImage: 'uploads/spaces/slika8.jpeg',
      images: ['uploads/spaces/slika9.jpeg', 'uploads/spaces/slika10.jpeg', 'uploads/spaces/slika1.jpeg', 'uploads/spaces/slika2.jpeg'],
      latitude: 44.8137,
      longitude: 20.4607,
      maxPenalties: 2,
      totalLikes: 61,
      totalDislikes: 3,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: oid(ids.space4),
      name: 'TechSpace Niš',
      city: 'Niš',
      address: 'Ulica Kralja Milana 22',
      description: 'The first premium coworking space in Niš. Community-driven environment with mentoring programs and networking events.',
      companyId: oid(ids.company1),
      managerId: oid(ids.manager1),
      pricePerHour: 3,
      status: 'active',
      mainImage: 'uploads/spaces/slika3.jpeg',
      images: ['uploads/spaces/slika4.jpeg', 'uploads/spaces/slika5.jpeg'],
      latitude: 43.3193,
      longitude: 21.8956,
      maxPenalties: 3,
      totalLikes: 22,
      totalDislikes: 1,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      _id: oid(ids.space5),
      name: 'WorkHub Subotica',
      city: 'Subotica',
      address: 'Korzo 5',
      description: 'Cozy coworking space in Subotica with Art Nouveau architecture. Ideal for creative professionals and remote workers.',
      companyId: oid(ids.company2),
      managerId: oid(ids.manager3),
      pricePerHour: 3.5,
      status: 'active',
      mainImage: 'uploads/spaces/slika6.jpeg',
      images: ['uploads/spaces/slika7.jpeg', 'uploads/spaces/slika8.jpeg', 'uploads/spaces/slika9.jpeg'],
      latitude: 46.1003,
      longitude: 19.6659,
      maxPenalties: 3,
      totalLikes: 29,
      totalDislikes: 2,
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  // ── space elements ─────────────────────────────────────────────────────────
  const spaceElements = [
    // Space 1 – Belgrade Hub
    { _id: oid(ids.el1_open), spaceId: oid(ids.space1), type: 'open',       name: 'Open Space',       deskCount: 20 },
    { _id: oid(ids.el1_off1), spaceId: oid(ids.space1), type: 'office',     name: 'Office Alpha',     deskCount: 4 },
    { _id: oid(ids.el1_off2), spaceId: oid(ids.space1), type: 'office',     name: 'Office Beta',      deskCount: 6 },
    { _id: oid(ids.el1_conf), spaceId: oid(ids.space1), type: 'conference', name: 'Meeting Room A',   equipment: 'Projector, whiteboard, video conferencing system, 12 ergonomic chairs' },

    // Space 2 – Novi Sad
    { _id: oid(ids.el2_open), spaceId: oid(ids.space2), type: 'open',       name: 'Open Floor',       deskCount: 15 },
    { _id: oid(ids.el2_off1), spaceId: oid(ids.space2), type: 'office',     name: 'Office One',       deskCount: 3 },
    { _id: oid(ids.el2_conf), spaceId: oid(ids.space2), type: 'conference', name: 'Conference Room 1', equipment: 'HDTV screen, video call setup, whiteboard' },

    // Space 3 – WorkHub Central
    { _id: oid(ids.el3_open), spaceId: oid(ids.space3), type: 'open',       name: 'Ground Floor Open', deskCount: 30 },
    { _id: oid(ids.el3_conf), spaceId: oid(ids.space3), type: 'conference', name: 'Boardroom',          equipment: 'Premium AV system, smart whiteboard, video conferencing, catering service available' },

    // Space 4 – Niš
    { _id: oid(ids.el4_open), spaceId: oid(ids.space4), type: 'open',       name: 'Main Hall',        deskCount: 10 },
    { _id: oid(ids.el4_off1), spaceId: oid(ids.space4), type: 'office',     name: 'Private Office',   deskCount: 2 },

    // Space 5 – Subotica
    { _id: oid(ids.el5_open), spaceId: oid(ids.space5), type: 'open',       name: 'Creative Floor',   deskCount: 8 },
    { _id: oid(ids.el5_conf), spaceId: oid(ids.space5), type: 'conference', name: 'Workshop Room',    equipment: 'Projector, flip chart, comfortable seating for 10' },
  ];

  // ── reservations ───────────────────────────────────────────────────────────
  const past   = (d: number) => date(new Date(Date.now() - d * 24 * 60 * 60 * 1000));
  const future = (d: number) => date(new Date(Date.now() + d * 24 * 60 * 60 * 1000));

  const reservations = [
    // alice – past confirmed in space1
    { _id: oid(ids.res1), memberId: oid(ids.member1), spaceId: oid(ids.space1), elementId: oid(ids.el1_open), startTime: past(10), endTime: past(9),  status: 'confirmed', createdAt: past(12), updatedAt: past(9) },
    // alice – past confirmed in space3
    { _id: oid(ids.res2), memberId: oid(ids.member1), spaceId: oid(ids.space3), elementId: oid(ids.el3_open), startTime: past(5),  endTime: past(4),  status: 'confirmed', createdAt: past(7),  updatedAt: past(4) },
    // alice – future active (cancellable)
    { _id: oid(ids.res3), memberId: oid(ids.member1), spaceId: oid(ids.space1), elementId: oid(ids.el1_off1), startTime: future(3), endTime: future(3), status: 'active',    createdAt: now(),    updatedAt: now() },
    // bob – past confirmed
    { _id: oid(ids.res4), memberId: oid(ids.member2), spaceId: oid(ids.space2), elementId: oid(ids.el2_open), startTime: past(7),  endTime: past(6),  status: 'confirmed', createdAt: past(9),  updatedAt: past(6) },
    // bob – future (within 12h, cannot cancel)
    { _id: oid(ids.res5), memberId: oid(ids.member2), spaceId: oid(ids.space3), elementId: oid(ids.el3_conf), startTime: future(0), endTime: future(0), status: 'active',    createdAt: now(),    updatedAt: now() },
    // charlie – past no_show
    { _id: oid(ids.res6), memberId: oid(ids.member3), spaceId: oid(ids.space1), elementId: oid(ids.el1_conf), startTime: past(3),  endTime: past(2),  status: 'no_show',   createdAt: past(5),  updatedAt: past(2) },
    // charlie – cancelled
    { _id: oid(ids.res7), memberId: oid(ids.member3), spaceId: oid(ids.space4), elementId: oid(ids.el4_open), startTime: past(15), endTime: past(14), status: 'cancelled', createdAt: past(20), updatedAt: past(15) },
    // alice – future (far, cancellable)
    { _id: oid(ids.res8), memberId: oid(ids.member1), spaceId: oid(ids.space2), elementId: oid(ids.el2_conf), startTime: future(7), endTime: future(7), status: 'active',    createdAt: now(),    updatedAt: now() },
  ];

  // ── reviews ────────────────────────────────────────────────────────────────
  const reviews = [
    {
      _id: oid(ids.rev1),
      memberId: oid(ids.member1),
      spaceId: oid(ids.space1),
      likeCount: 1,
      dislikeCount: 0,
      comments: [
        { text: 'Great space, very clean and fast internet!', createdAt: date(new Date(Date.now() - 9 * 86400000)) },
      ],
      createdAt: past(9),
      updatedAt: past(9),
    },
    {
      _id: oid(ids.rev2),
      memberId: oid(ids.member1),
      spaceId: oid(ids.space3),
      likeCount: 1,
      dislikeCount: 0,
      comments: [
        { text: 'Premium experience, totally worth the price.', createdAt: date(new Date(Date.now() - 4 * 86400000)) },
      ],
      createdAt: past(4),
      updatedAt: past(4),
    },
    {
      _id: oid(ids.rev3),
      memberId: oid(ids.member2),
      spaceId: oid(ids.space2),
      likeCount: 1,
      dislikeCount: 0,
      comments: [
        { text: 'Quiet and productive. Loved the view!', createdAt: date(new Date(Date.now() - 6 * 86400000)) },
      ],
      createdAt: past(6),
      updatedAt: past(6),
    },
  ];

  // ── penalties (charlie has 1 no-show in space1) ───────────────────────────
  const penalties = [
    {
      _id: { $oid: '6501000000000000000000f9' },
      memberId: oid(ids.member3),
      spaceId: oid(ids.space1),
      count: 1,
    },
  ];

  // ── write files ────────────────────────────────────────────────────────────
  const outDir = path.join(process.cwd(), 'seed-data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const collections: Record<string, unknown[]> = {
    companies,
    users,
    spaces,
    spaceelements: spaceElements,
    reservations,
    reviews,
    penalties,
  };

  for (const [name, data] of Object.entries(collections)) {
    const filePath = path.join(outDir, `${name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ seed-data/${name}.json  (${data.length} documents)`);
  }

  console.log('\nDone! Import each file into MongoDB Compass:');
  console.log('  Database: piaProjekat');
  console.log('  Collection name = file name (without .json)');
  console.log('\nTest credentials:');
  console.log('  Admin:   admin / Admin@123   → /secure-admin-access');
  console.log('  Manager: john.manager / Manager@12');
  console.log('  Member:  alice / Member@123');
}

main().catch(console.error);
