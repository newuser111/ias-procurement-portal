import { PrismaClient, Role, OrderStatus, Priority } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding IAS Procurement Portal...\n");

  // ── Cleanup (safe to re-run) ─────────────────────
  await prisma.inventoryCount.deleteMany();
  await prisma.inventoryCountSession.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.parLevel.deleteMany();
  console.log("✓ Cleaned existing seed data");

  // ── Locations ──────────────────────────────────────
  const locationData = [
    { name: "Austin", code: "ATX", region: "Texas" },
    { name: "Austin (South Lamar)", code: "ATX-SL", region: "Texas" },
    { name: "Biltmore", code: "BILT", region: "Arizona" },
    { name: "Corporate Office - Irving", code: "CORP", region: "Texas" },
    { name: "Dallas", code: "DAL", region: "Texas" },
    { name: "Fort Worth", code: "FW", region: "Texas" },
    { name: "Fort Worth (Alliance)", code: "FW-A", region: "Texas" },
    { name: "Frisco", code: "FRI", region: "Texas" },
    { name: "Houston", code: "HOU", region: "Texas" },
    { name: "Plano", code: "PLN", region: "Texas" },
    { name: "Prosper", code: "PROS", region: "Texas" },
    { name: "San Antonio", code: "SA", region: "Texas" },
    { name: "Scottsdale", code: "SCOTT", region: "Arizona" },
    { name: "The Woodlands", code: "WOOD", region: "Texas" },
    { name: "Tyler", code: "TYL", region: "Texas" },
    { name: "Washington D.C.", code: "DC", region: "DC" },
  ];

  const locations = await Promise.all(
    locationData.map((loc) =>
      prisma.location.upsert({
        where: { code: loc.code },
        update: {},
        create: loc,
      })
    )
  );
  console.log(`✓ ${locations.length} locations seeded`);

  // ── Vendors ────────────────────────────────────────
  const vendorData = [
    { name: "ADW", code: "ADW", paymentTerms: "Net 30" },
    { name: "Airgas", code: "AIRGAS", paymentTerms: "Net 30" },
    { name: "Alastin Skincare", code: "ALASTIN", paymentTerms: "Net 30" },
    { name: "Allergan Aesthetics", code: "ALLERGAN", paymentTerms: "Net 30" },
    { name: "Advantage", code: "ADVANTAGE", paymentTerms: "Net 30" },
    { name: "Allergan Direct", code: "ALLERGAN-D", paymentTerms: "Net 30" },
    { name: "Candela", code: "CANDELA", paymentTerms: "Net 30" },
    { name: "Clear & Brilliant (Solta/Bausch)", code: "CLEAR-BRILLIANT", paymentTerms: "Net 30" },
    { name: "CosmoFrance", code: "COSMOFRANCE", paymentTerms: "Net 30" },
    { name: "Delasco", code: "DELASCO", paymentTerms: "Net 30" },
    { name: "Esthemax", code: "ESTHEMAX", paymentTerms: "Net 30" },
    { name: "Galderma", code: "GALDERMA", paymentTerms: "Net 30" },
    { name: "HydraFacial", code: "HYDRAFACIAL", paymentTerms: "Net 30" },
    { name: "InMode", code: "INMODE", paymentTerms: "Net 30" },
    { name: "Kentek (C+B Goggles)", code: "KENTEK", paymentTerms: "Net 30" },
    { name: "Lutronic", code: "LUTRONIC", paymentTerms: "Net 30" },
    { name: "McKesson", code: "MCKESSON", paymentTerms: "Net 30" },
    { name: "Medline", code: "MEDLINE", paymentTerms: "Net 30" },
    { name: "Melio", code: "MELIO", paymentTerms: "Net 30" },
    { name: "Merz Aesthetics", code: "MERZ", paymentTerms: "Net 30" },
    { name: "MINT Threads", code: "MINT", paymentTerms: "Net 30" },
    { name: "Nitrile Gloves", code: "NITRILE", paymentTerms: "Net 30" },
    { name: "ODP (Office Depot)", code: "ODP", paymentTerms: "Net 30" },
    { name: "Olympia Pharmacy", code: "OLYMPIA", paymentTerms: "Net 30" },
    { name: "Plasma Pen (Plasma Concepts)", code: "PLASMA-PEN", paymentTerms: "Net 30" },
    { name: "Precise", code: "PRECISE", paymentTerms: "Net 30" },
    { name: "Sciton", code: "SCITON", paymentTerms: "Net 30" },
    { name: "Shippo", code: "SHIPPO", paymentTerms: "Net 30" },
    { name: "SkinBetter Science", code: "SKINBETTER", paymentTerms: "Net 30" },
    { name: "Softfil", code: "SOFTFIL", paymentTerms: "Net 30" },
    { name: "The Container Store", code: "CONTAINER-STORE", paymentTerms: "Net 30" },
    { name: "TTC", code: "TTC", paymentTerms: "Net 30" },
    { name: "USA", code: "USA", paymentTerms: "Net 30" },
    { name: "Vitality Institute", code: "VITALITY", paymentTerms: "Net 30" },
  ];

  const vendors = await Promise.all(
    vendorData.map((v) =>
      prisma.vendor.upsert({
        where: { code: v.code },
        update: {},
        create: v,
      })
    )
  );
  console.log(`✓ ${vendors.length} vendors seeded`);

  // ── Categories ─────────────────────────────────────
  const categoryData = [
    { name: "Medical Injectables", description: "Botox, fillers, Dysport, Kybella, threads" },
    { name: "Medical Supplies", description: "Needles, syringes, gauze, gloves, sharps containers" },
    { name: "Skincare & Retail", description: "Retail skincare products, serums, sunscreen" },
    { name: "Equipment & Devices", description: "Lasers, RF devices, treatment machines, goggles" },
    { name: "Facials & Treatments", description: "HydraFacial tips, peels, masks, treatment supplies" },
    { name: "Office & Facility", description: "Office supplies, cleaning, furniture, storage" },
    { name: "Pharmacy & Compounds", description: "Compounded topicals, numbing cream, medications" },
    { name: "Shipping & Packaging", description: "Shipping labels, boxes, packaging materials" },
  ];

  const categories = await Promise.all(
    categoryData.map((c) =>
      prisma.category.upsert({
        where: { name: c.name },
        update: {},
        create: c,
      })
    )
  );
  console.log(`✓ ${categories.length} categories seeded`);

  // Helper to find vendor/category by code/name
  const v = (code: string) => vendors.find((x) => x.code === code)!;
  const c = (name: string) => categories.find((x) => x.name === name)!;

  // ── Products ───────────────────────────────────────
  const productData = [
    // Medical Injectables
    { name: "Botox 100U", vendorCode: "ALLERGAN", category: "Medical Injectables", unitPrice: 396, unitOfMeasure: "vial" },
    { name: "Botox 200U", vendorCode: "ALLERGAN", category: "Medical Injectables", unitPrice: 792, unitOfMeasure: "vial" },
    { name: "Juvederm Ultra XC", vendorCode: "ALLERGAN", category: "Medical Injectables", unitPrice: 270, unitOfMeasure: "syringe" },
    { name: "Juvederm Voluma XC", vendorCode: "ALLERGAN", category: "Medical Injectables", unitPrice: 320, unitOfMeasure: "syringe" },
    { name: "Juvederm Volbella XC", vendorCode: "ALLERGAN", category: "Medical Injectables", unitPrice: 270, unitOfMeasure: "syringe" },
    { name: "Dysport 300U", vendorCode: "GALDERMA", category: "Medical Injectables", unitPrice: 460, unitOfMeasure: "vial" },
    { name: "Restylane", vendorCode: "GALDERMA", category: "Medical Injectables", unitPrice: 245, unitOfMeasure: "syringe" },
    { name: "Restylane Lyft", vendorCode: "GALDERMA", category: "Medical Injectables", unitPrice: 290, unitOfMeasure: "syringe" },
    { name: "Sculptra", vendorCode: "GALDERMA", category: "Medical Injectables", unitPrice: 350, unitOfMeasure: "vial" },
    { name: "Kybella", vendorCode: "ALLERGAN", category: "Medical Injectables", unitPrice: 590, unitOfMeasure: "vial" },
    { name: "Xeomin 100U", vendorCode: "MERZ", category: "Medical Injectables", unitPrice: 380, unitOfMeasure: "vial" },
    { name: "Radiesse", vendorCode: "MERZ", category: "Medical Injectables", unitPrice: 260, unitOfMeasure: "syringe" },
    { name: "MINT PDO Threads (10pk)", vendorCode: "MINT", category: "Medical Injectables", unitPrice: 180, unitOfMeasure: "pack" },
    { name: "Softfil Cannulas (20pk)", vendorCode: "SOFTFIL", category: "Medical Injectables", unitPrice: 95, unitOfMeasure: "box" },

    // Medical Supplies
    { name: "Nitrile Gloves - Small (100ct)", vendorCode: "NITRILE", category: "Medical Supplies", unitPrice: 12, unitOfMeasure: "box" },
    { name: "Nitrile Gloves - Medium (100ct)", vendorCode: "NITRILE", category: "Medical Supplies", unitPrice: 12, unitOfMeasure: "box" },
    { name: "Nitrile Gloves - Large (100ct)", vendorCode: "NITRILE", category: "Medical Supplies", unitPrice: 12, unitOfMeasure: "box" },
    { name: "Alcohol Prep Pads (200ct)", vendorCode: "MCKESSON", category: "Medical Supplies", unitPrice: 8, unitOfMeasure: "box" },
    { name: "Gauze Pads 4x4 (200ct)", vendorCode: "MCKESSON", category: "Medical Supplies", unitPrice: 15, unitOfMeasure: "box" },
    { name: "Sharps Container 2 Gallon", vendorCode: "MCKESSON", category: "Medical Supplies", unitPrice: 12, unitOfMeasure: "each" },
    { name: "BD Syringes 1mL (100ct)", vendorCode: "MCKESSON", category: "Medical Supplies", unitPrice: 28, unitOfMeasure: "box" },
    { name: "Needles 30G 1/2\" (100ct)", vendorCode: "MCKESSON", category: "Medical Supplies", unitPrice: 18, unitOfMeasure: "box" },
    { name: "Needles 32G 4mm (100ct)", vendorCode: "MCKESSON", category: "Medical Supplies", unitPrice: 22, unitOfMeasure: "box" },
    { name: "Tegaderm Film Dressings (100ct)", vendorCode: "MEDLINE", category: "Medical Supplies", unitPrice: 35, unitOfMeasure: "box" },
    { name: "Ice Packs Instant (24ct)", vendorCode: "MEDLINE", category: "Medical Supplies", unitPrice: 18, unitOfMeasure: "case" },

    // Skincare & Retail
    { name: "Alastin Regenerating Skin Nectar", vendorCode: "ALASTIN", category: "Skincare & Retail", unitPrice: 115, unitOfMeasure: "each" },
    { name: "Alastin Restorative Eye Treatment", vendorCode: "ALASTIN", category: "Skincare & Retail", unitPrice: 85, unitOfMeasure: "each" },
    { name: "Alastin INhance Post-Injection Serum", vendorCode: "ALASTIN", category: "Skincare & Retail", unitPrice: 56, unitOfMeasure: "each" },
    { name: "SkinBetter AlphaRet Overnight Cream", vendorCode: "SKINBETTER", category: "Skincare & Retail", unitPrice: 88, unitOfMeasure: "each" },
    { name: "SkinBetter Even Tone Correcting Serum", vendorCode: "SKINBETTER", category: "Skincare & Retail", unitPrice: 95, unitOfMeasure: "each" },
    { name: "VI Peel Original", vendorCode: "VITALITY", category: "Skincare & Retail", unitPrice: 48, unitOfMeasure: "each" },
    { name: "VI Peel Precision Plus", vendorCode: "VITALITY", category: "Skincare & Retail", unitPrice: 65, unitOfMeasure: "each" },

    // Equipment & Devices
    { name: "C+B Laser Safety Goggles", vendorCode: "KENTEK", category: "Equipment & Devices", unitPrice: 175, unitOfMeasure: "pair" },
    { name: "Sciton BBL Handpiece Filter", vendorCode: "SCITON", category: "Equipment & Devices", unitPrice: 850, unitOfMeasure: "each" },
    { name: "Morpheus8 Tips (25pk)", vendorCode: "INMODE", category: "Equipment & Devices", unitPrice: 1250, unitOfMeasure: "box" },
    { name: "Plasma Pen Tips Fine (10pk)", vendorCode: "PLASMA-PEN", category: "Equipment & Devices", unitPrice: 120, unitOfMeasure: "pack" },
    { name: "Clear & Brilliant Handpiece Tip", vendorCode: "CLEAR-BRILLIANT", category: "Equipment & Devices", unitPrice: 495, unitOfMeasure: "each" },

    // Facials & Treatments
    { name: "HydraFacial Hydra-Medic Tips (10pk)", vendorCode: "HYDRAFACIAL", category: "Facials & Treatments", unitPrice: 350, unitOfMeasure: "box" },
    { name: "HydraFacial Activ-4 Serum 60mL", vendorCode: "HYDRAFACIAL", category: "Facials & Treatments", unitPrice: 42, unitOfMeasure: "bottle" },
    { name: "HydraFacial Growth Factor Boost", vendorCode: "HYDRAFACIAL", category: "Facials & Treatments", unitPrice: 28, unitOfMeasure: "each" },
    { name: "Esthemax Hydrojelly Mask - Collagen", vendorCode: "ESTHEMAX", category: "Facials & Treatments", unitPrice: 8, unitOfMeasure: "each" },
    { name: "Esthemax Hydrojelly Mask - Vitamin C", vendorCode: "ESTHEMAX", category: "Facials & Treatments", unitPrice: 8, unitOfMeasure: "each" },
    { name: "CosmoFrance Microcurrent Gel 250mL", vendorCode: "COSMOFRANCE", category: "Facials & Treatments", unitPrice: 32, unitOfMeasure: "bottle" },

    // Office & Facility
    { name: "Copy Paper (10 ream case)", vendorCode: "ODP", category: "Office & Facility", unitPrice: 45, unitOfMeasure: "case" },
    { name: "Facial Tissue Boxes (36ct)", vendorCode: "ODP", category: "Office & Facility", unitPrice: 38, unitOfMeasure: "case" },
    { name: "Hand Sanitizer 8oz (12ct)", vendorCode: "ODP", category: "Office & Facility", unitPrice: 32, unitOfMeasure: "case" },
    { name: "Storage Bins - Clear (6pk)", vendorCode: "CONTAINER-STORE", category: "Office & Facility", unitPrice: 48, unitOfMeasure: "pack" },

    // Pharmacy & Compounds
    { name: "BLT Numbing Cream 30g", vendorCode: "OLYMPIA", category: "Pharmacy & Compounds", unitPrice: 22, unitOfMeasure: "tube" },
    { name: "BLT Numbing Cream 60g", vendorCode: "OLYMPIA", category: "Pharmacy & Compounds", unitPrice: 38, unitOfMeasure: "tube" },
    { name: "Arnica Topical Cream 60g", vendorCode: "OLYMPIA", category: "Pharmacy & Compounds", unitPrice: 18, unitOfMeasure: "tube" },

    // Shipping
    { name: "Shipping Labels 4x6 (500ct)", vendorCode: "SHIPPO", category: "Shipping & Packaging", unitPrice: 25, unitOfMeasure: "roll" },
  ];

  let productCount = 0;
  for (const p of productData) {
    const vendor = v(p.vendorCode);
    const category = c(p.category);
    await prisma.product.create({
      data: {
        name: p.name,
        vendorId: vendor.id,
        categoryId: category.id,
        unitPrice: p.unitPrice,
        unitOfMeasure: p.unitOfMeasure,
      },
    });
    productCount++;
  }
  console.log(`✓ ${productCount} products seeded`);

  // ── Users ──────────────────────────────────────────
  const pw = await hash("password123", 12);

  const userData = [
    { email: "clay@secretmedspa.com", name: "Clay Magnuson", role: Role.ADMIN, locationCode: null },
    { email: "purchasing@secretmedspa.com", name: "Garrett Gay", role: Role.PURCHASER, locationCode: null },
    { email: "manager.atx@itsasecret.com", name: "ATX Manager", role: Role.MANAGER, locationCode: "ATX" },
    { email: "manager.dal@itsasecret.com", name: "DAL Manager", role: Role.MANAGER, locationCode: "DAL" },
    { email: "manager.hou@itsasecret.com", name: "HOU Manager", role: Role.MANAGER, locationCode: "HOU" },
    { email: "manager.phx@itsasecret.com", name: "PHX Manager", role: Role.MANAGER, locationCode: "PHX" },
    { email: "employee1@itsasecret.com", name: "Sarah Johnson", role: Role.EMPLOYEE, locationCode: "ATX" },
    { email: "employee2@itsasecret.com", name: "Mike Chen", role: Role.EMPLOYEE, locationCode: "DAL" },
    { email: "employee3@itsasecret.com", name: "Emily Davis", role: Role.EMPLOYEE, locationCode: "HOU" },
  ];

  const users = await Promise.all(
    userData.map((u) => {
      const loc = u.locationCode ? locations.find((l) => l.code === u.locationCode) : null;
      return prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          name: u.name,
          passwordHash: pw,
          role: u.role,
          locationId: loc?.id ?? null,
        },
      });
    })
  );
  console.log(`✓ ${users.length} users seeded`);

  // ── Sample Purchase Orders ─────────────────────────
  const admin = users.find((u) => u.email === "clay@secretmedspa.com")!;
  const purchaser = users.find((u) => u.email === "purchasing@secretmedspa.com")!;
  const emp1 = users.find((u) => u.email === "employee1@itsasecret.com")!;
  const emp2 = users.find((u) => u.email === "employee2@itsasecret.com")!;
  const emp3 = users.find((u) => u.email === "employee3@itsasecret.com")!;
  const mgrAtx = users.find((u) => u.email === "manager.atx@itsasecret.com")!;

  const allergan = v("ALLERGAN");
  const mckesson = v("MCKESSON");
  const hydrafacial = v("HYDRAFACIAL");
  const galderma = v("GALDERMA");
  const odp = v("ODP");

  const atx = locations.find((l) => l.code === "ATX")!;
  const dal = locations.find((l) => l.code === "DAL")!;
  const hou = locations.find((l) => l.code === "HOU")!;

  // Get some products for line items
  const allProducts = await prisma.product.findMany();
  const findProduct = (name: string) => allProducts.find((p: { name: string }) => p.name.includes(name))!;

  // PO 1: Delivered
  const po1 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2026-0001",
      locationId: atx.id,
      requestedById: emp1.id,
      vendorId: allergan.id,
      status: OrderStatus.DELIVERED,
      priority: Priority.NORMAL,
      totalAmount: 2508,
      requestedAt: new Date("2026-02-01"),
      approvedAt: new Date("2026-02-01"),
      orderedAt: new Date("2026-02-02"),
      deliveredAt: new Date("2026-02-05"),
      items: {
        create: [
          { name: "Botox 100U", productId: findProduct("Botox 100U").id, quantity: 5, unitPrice: 396, totalPrice: 1980 },
          { name: "Juvederm Ultra XC", productId: findProduct("Juvederm Ultra XC").id, quantity: 2, unitPrice: 270, totalPrice: 540 - 12 },
        ],
      },
      approvals: {
        create: { userId: mgrAtx.id, action: "APPROVED", notes: "Routine restock" },
      },
    },
  });

  // PO 2: Approved, waiting to be ordered
  const po2 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2026-0002",
      locationId: dal.id,
      requestedById: emp2.id,
      vendorId: mckesson.id,
      status: OrderStatus.APPROVED,
      priority: Priority.HIGH,
      totalAmount: 95,
      requestedAt: new Date("2026-02-20"),
      approvedAt: new Date("2026-02-20"),
      items: {
        create: [
          { name: "Gauze Pads 4x4 (200ct)", productId: findProduct("Gauze Pads").id, quantity: 3, unitPrice: 15, totalPrice: 45 },
          { name: "Alcohol Prep Pads (200ct)", productId: findProduct("Alcohol Prep").id, quantity: 2, unitPrice: 8, totalPrice: 16 },
          { name: "BD Syringes 1mL (100ct)", productId: findProduct("BD Syringes").id, quantity: 1, unitPrice: 28, totalPrice: 28 },
        ],
      },
    },
  });

  // PO 3: Pending approval
  const po3 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2026-0003",
      locationId: hou.id,
      requestedById: emp3.id,
      vendorId: hydrafacial.id,
      status: OrderStatus.PENDING_APPROVAL,
      priority: Priority.NORMAL,
      totalAmount: 434,
      requestedAt: new Date("2026-02-25"),
      items: {
        create: [
          { name: "HydraFacial Hydra-Medic Tips (10pk)", productId: findProduct("Hydra-Medic Tips").id, quantity: 1, unitPrice: 350, totalPrice: 350 },
          { name: "HydraFacial Activ-4 Serum 60mL", productId: findProduct("Activ-4 Serum").id, quantity: 2, unitPrice: 42, totalPrice: 84 },
        ],
      },
    },
  });

  // PO 4: Draft
  const po4 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2026-0004",
      locationId: atx.id,
      requestedById: emp1.id,
      vendorId: odp.id,
      status: OrderStatus.DRAFT,
      priority: Priority.LOW,
      totalAmount: 115,
      items: {
        create: [
          { name: "Copy Paper (10 ream case)", productId: findProduct("Copy Paper").id, quantity: 1, unitPrice: 45, totalPrice: 45 },
          { name: "Facial Tissue Boxes (36ct)", productId: findProduct("Facial Tissue").id, quantity: 1, unitPrice: 38, totalPrice: 38 },
          { name: "Hand Sanitizer 8oz (12ct)", productId: findProduct("Hand Sanitizer").id, quantity: 1, unitPrice: 32, totalPrice: 32 },
        ],
      },
    },
  });

  // PO 5: Cancelled
  const po5 = await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2026-0005",
      locationId: dal.id,
      requestedById: emp2.id,
      vendorId: galderma.id,
      status: OrderStatus.CANCELLED,
      priority: Priority.NORMAL,
      totalAmount: 1380,
      cancelledAt: new Date("2026-02-18"),
      requestedAt: new Date("2026-02-15"),
      items: {
        create: [
          { name: "Dysport 300U", productId: findProduct("Dysport").id, quantity: 3, unitPrice: 460, totalPrice: 1380 },
        ],
      },
      approvals: {
        create: { userId: admin.id, action: "REJECTED", notes: "Duplicate order — already placed last week" },
      },
    },
  });

  console.log(`✓ 5 sample purchase orders seeded`);

  // ── Par Levels ─────────────────────────────────────
  const parLevelData = [
    // ATX - Austin
    { productName: "Botox 100U", locationCode: "ATX", min: 10, max: 20, current: 8 },
    { productName: "Botox 200U", locationCode: "ATX", min: 5, max: 10, current: 6 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", min: 8, max: 15, current: 3 },
    { productName: "Dysport 300U", locationCode: "ATX", min: 6, max: 12, current: 7 },
    { productName: "Nitrile Gloves - Medium", locationCode: "ATX", min: 10, max: 25, current: 4 },
    { productName: "Alcohol Prep Pads", locationCode: "ATX", min: 5, max: 10, current: 6 },
    { productName: "Gauze Pads", locationCode: "ATX", min: 5, max: 10, current: 2 },
    { productName: "BD Syringes", locationCode: "ATX", min: 3, max: 8, current: 5 },
    { productName: "Needles 30G", locationCode: "ATX", min: 3, max: 8, current: 4 },
    { productName: "HydraFacial Hydra-Medic Tips", locationCode: "ATX", min: 2, max: 5, current: 3 },
    { productName: "BLT Numbing Cream 30g", locationCode: "ATX", min: 10, max: 20, current: 12 },
    { productName: "Alastin Regenerating", locationCode: "ATX", min: 4, max: 8, current: 1 },

    // DAL - Dallas
    { productName: "Botox 100U", locationCode: "DAL", min: 12, max: 24, current: 15 },
    { productName: "Juvederm Ultra XC", locationCode: "DAL", min: 6, max: 12, current: 8 },
    { productName: "Dysport 300U", locationCode: "DAL", min: 8, max: 16, current: 2 },
    { productName: "Nitrile Gloves - Medium", locationCode: "DAL", min: 12, max: 30, current: 14 },
    { productName: "Sharps Container", locationCode: "DAL", min: 4, max: 8, current: 1 },
    { productName: "Sculptra", locationCode: "DAL", min: 4, max: 8, current: 5 },
    { productName: "Restylane", locationCode: "DAL", min: 6, max: 12, current: 7 },
    { productName: "BLT Numbing Cream 30g", locationCode: "DAL", min: 8, max: 16, current: 9 },

    // HOU - Houston
    { productName: "Botox 100U", locationCode: "HOU", min: 8, max: 16, current: 10 },
    { productName: "Restylane", locationCode: "HOU", min: 6, max: 12, current: 4 },
    { productName: "Nitrile Gloves - Small", locationCode: "HOU", min: 8, max: 20, current: 9 },
    { productName: "Nitrile Gloves - Medium", locationCode: "HOU", min: 10, max: 20, current: 3 },
    { productName: "Morpheus8 Tips", locationCode: "HOU", min: 2, max: 4, current: 1 },
    { productName: "HydraFacial Activ-4 Serum", locationCode: "HOU", min: 4, max: 8, current: 5 },
  ];

  let parCount = 0;
  for (const pl of parLevelData) {
    const product = allProducts.find((p: { name: string }) => p.name.includes(pl.productName));
    const location = locations.find((l) => l.code === pl.locationCode);
    if (product && location) {
      await prisma.parLevel.upsert({
        where: { productId_locationId: { productId: product.id, locationId: location.id } },
        update: { minLevel: pl.min, maxLevel: pl.max, currentQty: pl.current },
        create: { productId: product.id, locationId: location.id, minLevel: pl.min, maxLevel: pl.max, currentQty: pl.current },
      });
      parCount++;
    } else {
      console.warn(`  ⚠ Skipped: "${pl.productName}" at ${pl.locationCode} — product ${product ? "found" : "NOT FOUND"}, location ${location ? "found" : "NOT FOUND"}`);
    }
  }
  console.log(`✓ ${parCount} par levels seeded`);

  // ── Historical Inventory Counts ────────────────────
  // Weekly counts for key products at ATX to demonstrate burn rates
  const countHistory = [
    // Botox 100U at ATX — steady decline
    { productName: "Botox 100U", locationCode: "ATX", weeksAgo: 6, qty: 18 },
    { productName: "Botox 100U", locationCode: "ATX", weeksAgo: 5, qty: 16 },
    { productName: "Botox 100U", locationCode: "ATX", weeksAgo: 4, qty: 14 },
    { productName: "Botox 100U", locationCode: "ATX", weeksAgo: 3, qty: 12 },
    { productName: "Botox 100U", locationCode: "ATX", weeksAgo: 2, qty: 11 },
    { productName: "Botox 100U", locationCode: "ATX", weeksAgo: 1, qty: 8 },

    // Nitrile Gloves Medium at ATX — high burn rate
    { productName: "Nitrile Gloves - Medium", locationCode: "ATX", weeksAgo: 6, qty: 20 },
    { productName: "Nitrile Gloves - Medium", locationCode: "ATX", weeksAgo: 5, qty: 17 },
    { productName: "Nitrile Gloves - Medium", locationCode: "ATX", weeksAgo: 4, qty: 12 },
    { productName: "Nitrile Gloves - Medium", locationCode: "ATX", weeksAgo: 3, qty: 9 },
    { productName: "Nitrile Gloves - Medium", locationCode: "ATX", weeksAgo: 2, qty: 6 },
    { productName: "Nitrile Gloves - Medium", locationCode: "ATX", weeksAgo: 1, qty: 4 },

    // Juvederm Ultra XC at ATX — moderate decline
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 6, qty: 10 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 5, qty: 9 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 4, qty: 7 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 3, qty: 6 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 2, qty: 5 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 1, qty: 3 },

    // Dysport at DAL — sharp decline
    { productName: "Dysport 300U", locationCode: "DAL", weeksAgo: 5, qty: 14 },
    { productName: "Dysport 300U", locationCode: "DAL", weeksAgo: 4, qty: 10 },
    { productName: "Dysport 300U", locationCode: "DAL", weeksAgo: 3, qty: 7 },
    { productName: "Dysport 300U", locationCode: "DAL", weeksAgo: 2, qty: 4 },
    { productName: "Dysport 300U", locationCode: "DAL", weeksAgo: 1, qty: 2 },

    // Botox 100U at DAL — stable
    { productName: "Botox 100U", locationCode: "DAL", weeksAgo: 4, qty: 20 },
    { productName: "Botox 100U", locationCode: "DAL", weeksAgo: 3, qty: 18 },
    { productName: "Botox 100U", locationCode: "DAL", weeksAgo: 2, qty: 17 },
    { productName: "Botox 100U", locationCode: "DAL", weeksAgo: 1, qty: 15 },

    // Restylane at HOU — declining
    { productName: "Restylane", locationCode: "HOU", weeksAgo: 5, qty: 10 },
    { productName: "Restylane", locationCode: "HOU", weeksAgo: 4, qty: 8 },
    { productName: "Restylane", locationCode: "HOU", weeksAgo: 3, qty: 7 },
    { productName: "Restylane", locationCode: "HOU", weeksAgo: 2, qty: 5 },
    { productName: "Restylane", locationCode: "HOU", weeksAgo: 1, qty: 4 },
  ];

  let countNum = 0;
  for (const ch of countHistory) {
    const product = allProducts.find((p: { name: string }) => p.name.includes(ch.productName));
    const location = locations.find((l) => l.code === ch.locationCode);
    if (product && location) {
      const countDate = new Date();
      countDate.setDate(countDate.getDate() - ch.weeksAgo * 7);

      await prisma.inventoryCount.create({
        data: {
          productId: product.id,
          locationId: location.id,
          quantity: ch.qty,
          countedById: emp1.id,
          countedAt: countDate,
        },
      });
      countNum++;
    } else {
      console.warn(`  ⚠ Count skipped: "${ch.productName}" at ${ch.locationCode} — product ${product ? "found" : "NOT FOUND"}, location ${location ? "found" : "NOT FOUND"}`);
    }
  }
  console.log(`✓ ${countNum} inventory count records seeded`);

  console.log("\nSeed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
