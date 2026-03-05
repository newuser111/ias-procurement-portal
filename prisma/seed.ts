import { PrismaClient, Role, OrderStatus, Priority, ProductType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding IAS Procurement Portal...\n");

  // ── Cleanup (safe to re-run) ─────────────────────
  await prisma.inventoryCount.deleteMany().catch(() => {});
  await prisma.inventoryCountSession.deleteMany().catch(() => {});
  await prisma.approval.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.parLevel.deleteMany().catch(() => {});
  await prisma.product.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.category.deleteMany();
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

  // ── Vendors (28 real vendors from Product Centers workbook) ──
  const vendorData = [
    { name: "Alastin", code: "ALASTIN", paymentTerms: "Net 30" },
    { name: "Allergan", code: "ALLERGAN", paymentTerms: "Net 30" },
    { name: "ariessence", code: "ARIESSENCE", paymentTerms: "Net 30" },
    { name: "Bellus Medical", code: "BELLUS", paymentTerms: "Net 30" },
    { name: "BENEV", code: "BENEV", paymentTerms: "Net 30" },
    { name: "Circē", code: "CIRCE", paymentTerms: "Net 30" },
    { name: "Clear+Brilliant (Solta)", code: "CLEAR-BRILLIANT", paymentTerms: "Net 30" },
    { name: "CosmoFrance", code: "COSMOFRANCE", paymentTerms: "Net 30" },
    { name: "Cynosure", code: "CYNOSURE", paymentTerms: "Net 30" },
    { name: "ELEVAI Labs", code: "ELEVAI", paymentTerms: "Net 30" },
    { name: "Elta MD", code: "ELTAMD", paymentTerms: "Net 30" },
    { name: "Galderma", code: "GALDERMA", paymentTerms: "Net 30" },
    { name: "Hydrafacial", code: "HYDRAFACIAL", paymentTerms: "Net 30" },
    { name: "InMode", code: "INMODE", paymentTerms: "Net 30" },
    { name: "Innovation Aesthetics", code: "INNOVATION", paymentTerms: "Net 30" },
    { name: "Integrity", code: "INTEGRITY", paymentTerms: "Net 30" },
    { name: "JuveXO", code: "JUVEXO", paymentTerms: "Net 30" },
    { name: "MINT PDO Threads", code: "MINT", paymentTerms: "Net 30" },
    { name: "Merz Aesthetics", code: "MERZ", paymentTerms: "Net 30" },
    { name: "Pavise", code: "PAVISE", paymentTerms: "Net 30" },
    { name: "Regen Labs", code: "REGENLABS", paymentTerms: "Net 30" },
    { name: "Rejuran", code: "REJURAN", paymentTerms: "Net 30" },
    { name: "Revance", code: "REVANCE", paymentTerms: "Net 30" },
    { name: "Sciton", code: "SCITON", paymentTerms: "Net 30" },
    { name: "SkinMedica", code: "SKINMEDICA", paymentTerms: "Net 30" },
    { name: "Skinbetter Science", code: "SKINBETTER", paymentTerms: "Net 30" },
    { name: "Vitality Institute", code: "VITALITY", paymentTerms: "Net 30" },
    { name: "Xtressé", code: "XTRESSE", paymentTerms: "Net 30" },
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

  // ── Categories (4 real categories) ─────────────────
  const categoryData = [
    { name: "Services", description: "Treatments and consumable procedure supplies" },
    { name: "Facial Care", description: "Retail skincare products" },
    { name: "Backbar", description: "Professional-size products used during treatments" },
    { name: "Wellness", description: "Wellness products" },
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

  // Helpers
  const v = (name: string) => vendors.find((x) => x.name === name)!;
  const cat = (name: string) => categories.find((x) => x.name === name)!;

  // ── Products (185 real products from Product Centers workbook) ──
  const productData: {
    name: string;
    vendor: string | null;
    category: string;
    sub: string;
    type: ProductType;
    price: number;
    uom: string;
    sku?: string;
  }[] = [
    { name: "Activ-4 Skin Solution, 8 oz. bottle", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 15", sku: "70137" },
    { name: "AHA/BHA Exfoliating Cleanser", vendor: "SkinMedica", category: "Facial Care", sub: "Cleanser", type: ProductType.RETAIL, price: 48, uom: "each", sku: "300234945062" },
    { name: "AlphaRet Clearing Serum 30ML", vendor: "Skinbetter Science", category: "Facial Care", sub: "Correcting Creams", type: ProductType.RETAIL, price: 145, uom: "each", sku: "111100000014" },
    { name: "AlphaRet Exfoliating Peel Pads", vendor: "Skinbetter Science", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 125, uom: "each", sku: "858970006351" },
    { name: "AlphaRet Overnight Cream 30ML", vendor: "Skinbetter Science", category: "Facial Care", sub: "Correcting Creams", type: ProductType.RETAIL, price: 145, uom: "each", sku: "865800000250" },
    { name: "AlphaRet Professional Peel System 30", vendor: "Skinbetter Science", category: "Services", sub: "Peels", type: ProductType.BOTH, price: 0, uom: "each", sku: "SB5505" },
    { name: "Alto Advanced Defense and Repair Serum 30ML", vendor: "Skinbetter Science", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 195, uom: "each", sku: "111100000045" },
    { name: "Alto Defense Serum 30ML", vendor: "Skinbetter Science", category: "Facial Care", sub: "Correcting Creams", type: ProductType.RETAIL, price: 170, uom: "each", sku: "858970006092" },
    { name: "A-Luminate Brightening Serum", vendor: "Alastin", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 198, uom: "each", sku: "111100000090" },
    { name: "Ampra Volumizing Macro HA Serum", vendor: "Skinbetter Science", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 180, uom: "each", sku: "111100000173" },
    { name: "Antiox + Skin Solution, 8 oz. bottle", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 15", sku: "70353" },
    { name: "ariessence PDGF", vendor: "ariessence", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000148" },
    { name: "A-Team Duo Kit", vendor: "Skinbetter Science", category: "Facial Care", sub: "Skin Care Systems", type: ProductType.RETAIL, price: 185, uom: "each", sku: "858970006214" },
    { name: "BACKBAR - AlphaRet Overnight Cream 50ML", vendor: "Skinbetter Science", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000079" },
    { name: "BACKBAR - Alto Advanced Defense and Repair Serum 50ML", vendor: "Skinbetter Science", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000080" },
    { name: "BACKBAR - Calming Masque 8 oz", vendor: "SkinMedica", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000070" },
    { name: "BACKBAR - Cleansing Gel 16oz", vendor: "Skinbetter Science", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000081" },
    { name: "BACKBAR - Essential Defense Mineral Shield SPF 32 8 oz, tinted", vendor: "SkinMedica", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000071" },
    { name: "BACKBAR - Essential Defense Mineral Shield SPF 35 8 oz", vendor: "SkinMedica", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000072" },
    { name: "BACKBAR - Facial Cleanser 16 fl oz", vendor: "SkinMedica", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000073" },
    { name: "BACKBAR - HA5 Hydra Collagen 8 oz", vendor: "SkinMedica", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000074" },
    { name: "BACKBAR - Instant Bright Eye Mask", vendor: "SkinMedica", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 75, uom: "each", sku: "111100000029" },
    { name: "BACKBAR - Purifying Masque 8 oz", vendor: "SkinMedica", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000075" },
    { name: "BACKBAR - Regenerating Skin Nectar", vendor: "Alastin", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000087" },
    { name: "BACKBAR - sunbetter TONE SMART SPF 75 Sunscreen Lotion 8oz", vendor: "Skinbetter Science", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000085" },
    { name: "BACKBAR - TNS Ceramide Treatment Cream 8 oz", vendor: "SkinMedica", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000076" },
    { name: "BACKBAR - TNS Hydrating Masque 8 oz", vendor: "SkinMedica", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000077" },
    { name: "BACKBAR - Ultra Sheer Moisturizer 8 oz", vendor: "SkinMedica", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000078" },
    { name: "BACKBAR HA - Immerse Serum", vendor: "Alastin", category: "Backbar", sub: "Backbar Products", type: ProductType.BOTH, price: 0, uom: "each", sku: "111100000099" },
    { name: "BENEV Exosomes", vendor: "Innovation Aesthetics", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000104" },
    { name: "Beta-HD Clear Skin Solution, 8 oz. bottle", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 10", sku: "70406" },
    { name: "Bioadaptive Stress Repair", vendor: "Pavise", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 198, uom: "each", sku: "111100000147" },
    { name: "Bioadaptive Stress Repair REFILL", vendor: "Pavise", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 178, uom: "each", sku: "BSRREFILL" },
    { name: "Botox", vendor: "Allergan", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 13.5, uom: "each", sku: "92326" },
    { name: "Britenol (6 vials/box)", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 6", sku: "70367" },
    { name: "C&B Original", vendor: "Clear+Brilliant (Solta)", category: "Services", sub: "Laser", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000057" },
    { name: "C&B Original SAMPLE - 12 Units", vendor: "Clear+Brilliant (Solta)", category: "Services", sub: "Laser", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000140" },
    { name: "C&B Permea", vendor: "Clear+Brilliant (Solta)", category: "Services", sub: "Laser", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000058" },
    { name: "C&B Touch", vendor: "Clear+Brilliant (Solta)", category: "Services", sub: "Laser", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000059" },
    { name: "Cleansing Gel", vendor: "Skinbetter Science", category: "Facial Care", sub: "Cleanser", type: ProductType.RETAIL, price: 50, uom: "each", sku: "111100000012" },
    { name: "CoolSculpt Elite", vendor: "Allergan", category: "Services", sub: "Coolsculpting", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000043" },
    { name: "Coolsculpting Advantage", vendor: "Allergan", category: "Services", sub: "Coolsculpting", type: ProductType.CONSUMABLE, price: 600, uom: "each", sku: "BRZ-RP1-160-024" },
    { name: "Coolsculpting Advantage Plus", vendor: "Allergan", category: "Services", sub: "Coolsculpting", type: ProductType.CONSUMABLE, price: 1200, uom: "each", sku: "BRZ-RP1-180-016" },
    { name: "Coolsculpting Mini", vendor: "Allergan", category: "Services", sub: "Coolsculpting", type: ProductType.CONSUMABLE, price: 750, uom: "each", sku: "BRZ-RP1-02X-024" },
    { name: "Coolsculpting Petite", vendor: "Allergan", category: "Services", sub: "Coolsculpting", type: ProductType.CONSUMABLE, price: 600, uom: "each", sku: "BRZ-RP1-140-024" },
    { name: "Coolsculpting Smooth", vendor: "Allergan", category: "Services", sub: "Coolsculpting", type: ProductType.CONSUMABLE, price: 600, uom: "each", sku: "BRZ-RP1-091-024" },
    { name: "Cosmo France PRF Tube", vendor: "CosmoFrance", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000130" },
    { name: "C-Radical Defense", vendor: "Alastin", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 218, uom: "each", sku: "111100000120" },
    { name: "C-Radical Defense SAMPLE", vendor: "Alastin", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 178, uom: "pack of 6", sku: "111100000138" },
    { name: "DermaBuilder (6 vials/box)", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 6", sku: "70276" },
    { name: "Detoxifying Scrub Mask", vendor: "Skinbetter Science", category: "Facial Care", sub: "Mask", type: ProductType.RETAIL, price: 60, uom: "each", sku: "865800000205" },
    { name: "Dynamic Age Defense", vendor: "Pavise", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 130, uom: "each", sku: "111100000145" },
    { name: "Dynamic Age Defense REFILL", vendor: "Pavise", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 110, uom: "each", sku: "DADREFILL" },
    { name: "Dysport", vendor: "Galderma", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 4, uom: "each", sku: "5005281" },
    { name: "Empower Exosomes", vendor: "ELEVAI Labs", category: "Services", sub: "Add Ons", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000128" },
    { name: "Enfinity Daily Regenerative Serum", vendor: "ELEVAI Labs", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 299, uom: "each", sku: "111100000129" },
    { name: "Essential Defense Mineral Shield SPF 32 Tinted", vendor: "SkinMedica", category: "Facial Care", sub: "Sun Protection", type: ProductType.RETAIL, price: 40, uom: "each", sku: "95675" },
    { name: "Essential Defense Mineral Shield SPF 35", vendor: "SkinMedica", category: "Facial Care", sub: "Sun Protection", type: ProductType.RETAIL, price: 40, uom: "each", sku: "300235703173" },
    { name: "Even Tone Correcting Serum 50ML", vendor: "Skinbetter Science", category: "Facial Care", sub: "Correcting Creams", type: ProductType.RETAIL, price: 165, uom: "each", sku: "858970006252" },
    { name: "EyeMax AlphaRet Overnight Cream", vendor: "Skinbetter Science", category: "Facial Care", sub: "Correcting Creams", type: ProductType.RETAIL, price: 130, uom: "each", sku: "SB5128" },
    { name: "EZ Gel Kit", vendor: "CosmoFrance", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000100" },
    { name: "Facial Cleanser", vendor: "SkinMedica", category: "Facial Care", sub: "Cleanser", type: ProductType.RETAIL, price: 40, uom: "each", sku: "300234944065" },
    { name: "Fusion Tip CP-21", vendor: "Cynosure", category: "Services", sub: "Morpheus8", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000125" },
    { name: "Gentle Amino Powerwash", vendor: "Pavise", category: "Facial Care", sub: "Cleanser", type: ProductType.RETAIL, price: 56, uom: "each", sku: "111100000146" },
    { name: "Gentle Cleanser", vendor: "Alastin", category: "Facial Care", sub: "Cleanser", type: ProductType.RETAIL, price: 58, uom: "each", sku: "111100000126" },
    { name: "GlySal Peel 15%, (6 vials/box)", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 6", sku: "7000068" },
    { name: "GlySal Peel 30% (6 vials/box)", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 6", sku: "7000069" },
    { name: "GlySal Prep, (6 vials/box)", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 6", sku: "70200" },
    { name: "HA Immerse Serum", vendor: "Alastin", category: "Facial Care", sub: "Moisturizer", type: ProductType.RETAIL, price: 134, uom: "each", sku: "111100000098" },
    { name: "HA5 Hydra Collagen Replenish + Restore Hydrator", vendor: "SkinMedica", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 192, uom: "each", sku: "111100000136" },
    { name: "HA5 Rejuvenating Hydrator 2oz", vendor: "SkinMedica", category: "Facial Care", sub: "Moisturizer", type: ProductType.RETAIL, price: 184, uom: "each", sku: "300235603022" },
    { name: "Healing Essence", vendor: "Rejuran", category: "Services", sub: "Add Ons", type: ProductType.CONSUMABLE, price: 399, uom: "each", sku: "111100000170" },
    { name: "HydraRet A", vendor: "Circē", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 125, uom: "each", sku: "111100000163" },
    { name: "Hydrating Boosting Cream", vendor: "Skinbetter Science", category: "Facial Care", sub: "Moisturizer", type: ProductType.RETAIL, price: 100, uom: "each", sku: "SB5404" },
    { name: "HydraTint Pro Mineral SPF 36", vendor: "Alastin", category: "Facial Care", sub: "Sun Protection", type: ProductType.RETAIL, price: 84, uom: "each", sku: "111100000094" },
    { name: "Hydropeel Tip, Blue 15-Pack", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 15", sku: "74112-15" },
    { name: "Hydropeel Tip, Body 15-pack", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 15", sku: "70218" },
    { name: "Hydropeel Tip, Clear 15-Pack", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 15", sku: "74111-15" },
    { name: "Hydropeel Tip, Orange Aggression 15-Pack", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 15", sku: "74275-15" },
    { name: "Hydropeel Tip, Purple Aggression 15-Pack", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 15", sku: "74462-15" },
    { name: "Hydropeel Tip, Teal 15-Pack", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 15", sku: "74114-15" },
    { name: "Hylenex", vendor: "Allergan", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 1.5, uom: "each", sku: "Hylenex100" },
    { name: "I-25 Insulated Needle", vendor: "Cynosure", category: "Services", sub: "Potenza", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000111" },
    { name: "I-49 Insulated Needle", vendor: "Cynosure", category: "Services", sub: "Potenza", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000112" },
    { name: "Illuminize Peel", vendor: "SkinMedica", category: "Services", sub: "Peels", type: ProductType.CONSUMABLE, price: 150, uom: "each", sku: "94943" },
    { name: "INhance Post-Injection Serum", vendor: "Alastin", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 72, uom: "each", sku: "111100000089" },
    { name: "Instant Eye Gel", vendor: "Skinbetter Science", category: "Facial Care", sub: "Correcting Creams", type: ProductType.RETAIL, price: 110, uom: "each", sku: "SB5204" },
    { name: "Integrity PRF Tube", vendor: "Integrity", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000046" },
    { name: "Integrity PRP Tube", vendor: "Integrity", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000048" },
    { name: "Intensive AlphaRet Overnight Cream 30ML", vendor: "Skinbetter Science", category: "Facial Care", sub: "Correcting Creams", type: ProductType.RETAIL, price: 145, uom: "each", sku: "858970006306" },
    { name: "InterFuse Intensive Treatment 15ML LINES", vendor: "Skinbetter Science", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 145, uom: "each", sku: "865800000229" },
    { name: "InterFuse Treatment Cream 30ML FACE & NECK", vendor: "Skinbetter Science", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 140, uom: "each", sku: "SB5001" },
    { name: "InterFuse Treatment Cream EYE", vendor: "Skinbetter Science", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 125, uom: "each", sku: "SB5008" },
    { name: "Juvederm Ultra Plus", vendor: "Allergan", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 70, uom: "each", sku: "94155" },
    { name: "Juvederm Ultra XC", vendor: "Allergan", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 70, uom: "each", sku: "94154" },
    { name: "Juvederm Volbella", vendor: "Allergan", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 78, uom: "each", sku: "96181" },
    { name: "Juvederm Vollure", vendor: "Allergan", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 75, uom: "each", sku: "95661" },
    { name: "Juvederm Voluma", vendor: "Allergan", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 78, uom: "each", sku: "94640" },
    { name: "Juvederm Volux", vendor: "Allergan", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 850, uom: "each", sku: "111100000092" },
    { name: "JuveXO Exosomes", vendor: "JuveXO", category: "Services", sub: "Add Ons", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000161" },
    { name: "Kybella", vendor: "Allergan", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "95706" },
    { name: "Letybo", vendor: "BENEV", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 13.5, uom: "each", sku: "111100000150" },
    { name: "MINT Fine", vendor: "MINT PDO Threads", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000051" },
    { name: "MINT Fix", vendor: "MINT PDO Threads", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000052" },
    { name: "MINT Mono 25 G", vendor: "MINT PDO Threads", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000049" },
    { name: "MINT Mono 30 G", vendor: "MINT PDO Threads", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000056" },
    { name: "MINT Petit", vendor: "MINT PDO Threads", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000050" },
    { name: "Morpheus8 24 Pin Tip", vendor: "InMode", category: "Services", sub: "Morpheus8", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "AG607563A" },
    { name: "Morpheus8 Body 40 Pin Tip", vendor: "InMode", category: "Services", sub: "Morpheus8", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "AG609135A" },
    { name: "Morpheus8 Prime 12 Pin Tip", vendor: "InMode", category: "Services", sub: "Morpheus8", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "AG609136A" },
    { name: "Morpheus8 Resurfacing Tips", vendor: "InMode", category: "Services", sub: "Morpheus8", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "AG608575A" },
    { name: "Moxi Tip", vendor: "Sciton", category: "Services", sub: "Laser", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000127" },
    { name: "Mystro Active Balance Serum 30 ml", vendor: "Skinbetter Science", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 225, uom: "each", sku: "111100000103" },
    { name: "OptiCide3 Disinfecting", vendor: "Allergan", category: "Services", sub: "Diamond Glow", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000115" },
    { name: "Oxygen Infusion Wash", vendor: "Skinbetter Science", category: "Facial Care", sub: "Cleanser", type: ProductType.RETAIL, price: 42, uom: "pack of 18", sku: "858970006160" },
    { name: "Phytofacials", vendor: "Circē", category: "Services", sub: "Add Ons", type: ProductType.RETAIL, price: 48, uom: "each", sku: "111100000164" },
    { name: "Pore Clarifying Pro Infusion Serum", vendor: "SkinMedica", category: "Services", sub: "Diamond Glow", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000105" },
    { name: "Precision Eye Lift", vendor: "Pavise", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 112, uom: "each", sku: "111100000156" },
    { name: "Procedure Enhancement System", vendor: "Alastin", category: "Facial Care", sub: "Skin Care Systems", type: ProductType.RETAIL, price: 306, uom: "each", sku: "111100000088" },
    { name: "Radiesse Classic", vendor: "Merz Aesthetics", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000102" },
    { name: "Refining Foam Cleanser", vendor: "Skinbetter Science", category: "Facial Care", sub: "Cleanser", type: ProductType.RETAIL, price: 48, uom: "each", sku: "111100000119" },
    { name: "Regenerating Skin Nectar", vendor: "Alastin", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 258, uom: "each", sku: "111100000093" },
    { name: "RegenLab PRP Tube", vendor: "Regen Labs", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000005" },
    { name: "Rejuvenative Moisturizer", vendor: "SkinMedica", category: "Facial Care", sub: "Moisturizer", type: ProductType.RETAIL, price: 60, uom: "each", sku: "300234955023" },
    { name: "Rejuvenize Peel", vendor: "SkinMedica", category: "Services", sub: "Peels", type: ProductType.CONSUMABLE, price: 200, uom: "each", sku: "94941" },
    { name: "Renewal Retinol .25", vendor: "Alastin", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 81, uom: "each", sku: "111100000121" },
    { name: "Renewal Retinol .5", vendor: "Alastin", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 81, uom: "each", sku: "111100000123" },
    { name: "Restorative Eye Treatment", vendor: "Alastin", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 128, uom: "each", sku: "111100000124" },
    { name: "Restorative Skin Complex", vendor: "Alastin", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 258, uom: "each", sku: "111100000095" },
    { name: "Restylane Contour", vendor: "Galderma", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 78, uom: "each", sku: "111100000039" },
    { name: "Restylane Contour - SAMPLE", vendor: "Galderma", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 78, uom: "pack of 10", sku: "111100000137" },
    { name: "Restylane Defyne", vendor: "Galderma", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 70, uom: "each", sku: "5006490" },
    { name: "Restylane Eyelight", vendor: "Galderma", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000108" },
    { name: "Restylane Kysse", vendor: "Galderma", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 82, uom: "each", sku: "111100000006" },
    { name: "Restylane Lyft", vendor: "Galderma", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 65, uom: "each", sku: "5006151" },
    { name: "Restylane Refyne", vendor: "Galderma", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 70, uom: "each", sku: "5006492" },
    { name: "Restylane-L", vendor: "Galderma", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 65, uom: "each", sku: "5006152" },
    { name: "ReSURFACE Skin Polish", vendor: "Alastin", category: "Facial Care", sub: "Cleanser", type: ProductType.RETAIL, price: 78, uom: "each", sku: "111100000096" },
    { name: "RHA 2", vendor: "Revance", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 80, uom: "each", sku: "111100000167" },
    { name: "RHA 3", vendor: "Revance", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 80, uom: "each", sku: "111100000168" },
    { name: "RHA 4", vendor: "Revance", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 70.83, uom: "each", sku: "111100000169" },
    { name: "RHA Redensity", vendor: "Revance", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 80, uom: "each", sku: "111100000166" },
    { name: "Rinseaway, 8 oz. bottle", vendor: "Hydrafacial", category: "Services", sub: "Hydrafacial", type: ProductType.CONSUMABLE, price: 0, uom: "pack of 15", sku: "70140" },
    { name: "S-25 Insulated Semi-Needle", vendor: "Cynosure", category: "Services", sub: "Potenza", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000113" },
    { name: "Sculptra", vendor: "Galderma", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "5005044" },
    { name: "Skin Booster", vendor: "Rejuran", category: "Services", sub: "Add Ons", type: ProductType.CONSUMABLE, price: 95, uom: "each", sku: "111100000171" },
    { name: "SkinPen Masque", vendor: "Bellus Medical", category: "Services", sub: "Mask", type: ProductType.CONSUMABLE, price: 25, uom: "each", sku: "111100000097" },
    { name: "SkinPen Treatment Kit", vendor: "Bellus Medical", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "BASIC-F5SP014" },
    { name: "SKINVIVE", vendor: "Allergan", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000109" },
    { name: "Solo Hydrating Defense MEN", vendor: "Skinbetter Science", category: "Facial Care", sub: "Moisturizer", type: ProductType.RETAIL, price: 175, uom: "each", sku: "111100000007" },
    { name: "STAFF Bioadaptive Stress Repair", vendor: "Pavise", category: "Facial Care", sub: "Staff Product", type: ProductType.RETAIL, price: 0, uom: "each", sku: "111100000153" },
    { name: "STAFF Bioadaptive Stress Repair REFILL", vendor: "Pavise", category: "Facial Care", sub: "Staff Product", type: ProductType.RETAIL, price: 0, uom: "each", sku: "111100000158" },
    { name: "STAFF Dynamic Age Defense", vendor: "Pavise", category: "Facial Care", sub: "Staff Product", type: ProductType.RETAIL, price: 0, uom: "each", sku: "111100000152" },
    { name: "STAFF Dynamic Age Defense REFILL", vendor: "Pavise", category: "Facial Care", sub: "Staff Product", type: ProductType.RETAIL, price: 0, uom: "each", sku: "111100000159" },
    { name: "STAFF Gentle Amino Powerwash", vendor: "Pavise", category: "Facial Care", sub: "Staff Product", type: ProductType.RETAIL, price: 0, uom: "each", sku: "111100000151" },
    { name: "STAFF Precision Eye Lift", vendor: "Pavise", category: "Facial Care", sub: "Staff Product", type: ProductType.RETAIL, price: 0, uom: "each", sku: "111100000160" },
    { name: "sunbetter SHEER 70 Sunscreen Lotion", vendor: "Skinbetter Science", category: "Facial Care", sub: "Sun Protection", type: ProductType.RETAIL, price: 75, uom: "each", sku: "111100000016" },
    { name: "sunbetter SHEER SPF 56 Sunscreen Stick", vendor: "Skinbetter Science", category: "Facial Care", sub: "Sun Protection", type: ProductType.RETAIL, price: 55, uom: "each", sku: "858970006467" },
    { name: "sunbetter TONE SMART 75 Sunscreen Lotion", vendor: "Skinbetter Science", category: "Facial Care", sub: "Sun Protection", type: ProductType.RETAIL, price: 75, uom: "each", sku: "111100000015" },
    { name: "sunbetter TONE SMART SPF 68 Sunscreen Compact", vendor: "Skinbetter Science", category: "Facial Care", sub: "Sun Protection", type: ProductType.RETAIL, price: 65, uom: "each", sku: "858970006481" },
    { name: "sunbetter TONE SMART SPF 75 Sunscreen Lotion 15ml", vendor: "Skinbetter Science", category: "Facial Care", sub: "Sun Protection", type: ProductType.RETAIL, price: 35, uom: "each", sku: "111100000044" },
    { name: "SupraTonic C", vendor: "Circē", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 105, uom: "each", sku: "111100000162" },
    { name: "Techno Neck Perfecting Cream", vendor: "Skinbetter Science", category: "Facial Care", sub: "Correcting Creams", type: ProductType.RETAIL, price: 155, uom: "each", sku: "111100000041" },
    { name: "TNS A+", vendor: "SkinMedica", category: "Facial Care", sub: "Targeted Treatments", type: ProductType.RETAIL, price: 295, uom: "each", sku: "111100000026" },
    { name: "TNS Ceramide Treatment Cream", vendor: "SkinMedica", category: "Facial Care", sub: "Moisturizer", type: ProductType.RETAIL, price: 72, uom: "each", sku: "0023495702" },
    { name: "TNS Eye Repair", vendor: "SkinMedica", category: "Facial Care", sub: "Moisturizer", type: ProductType.RETAIL, price: 106, uom: "each", sku: "300234934059" },
    { name: "TNS Advanced+ Pro Infusion Serum", vendor: "SkinMedica", category: "Services", sub: "Diamond Glow", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000106" },
    { name: "Trio Luxe Moisture Treatment 50ML", vendor: "Skinbetter Science", category: "Facial Care", sub: "Moisturizer", type: ProductType.RETAIL, price: 180, uom: "each", sku: "SA100200" },
    { name: "Trio Rebalancing Moisture Treatment 50ML", vendor: "Skinbetter Science", category: "Facial Care", sub: "Moisturizer", type: ProductType.RETAIL, price: 160, uom: "each", sku: "858970106389" },
    { name: "Ultra Sheer Moisturizer", vendor: "SkinMedica", category: "Facial Care", sub: "Moisturizer", type: ProductType.RETAIL, price: 60, uom: "each", sku: "300234952022" },
    { name: "UV Clear Deep Tinted", vendor: "Elta MD", category: "Facial Care", sub: "Sun Protection", type: ProductType.RETAIL, price: 47, uom: "each", sku: "111100000135" },
    { name: "UV Clear Tinted", vendor: "Elta MD", category: "Facial Care", sub: "Sun Protection", type: ProductType.RETAIL, price: 47, uom: "each", sku: "111100000134" },
    { name: "UV Clear Untinted", vendor: "Elta MD", category: "Facial Care", sub: "Sun Protection", type: ProductType.RETAIL, price: 45, uom: "each", sku: "111100000133" },
    { name: "VI Peel Large Body", vendor: "Vitality Institute", category: "Services", sub: "Peels", type: ProductType.CONSUMABLE, price: 350, uom: "each", sku: "111100000144" },
    { name: "VI Peel Original", vendor: "Vitality Institute", category: "Services", sub: "Peels", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000053" },
    { name: "VI Peel Precision Plus", vendor: "Vitality Institute", category: "Services", sub: "Peels", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000054" },
    { name: "VI Peel Purify w/ Precision Plus", vendor: "Vitality Institute", category: "Services", sub: "Peels", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000055" },
    { name: "VI Peel Small Body", vendor: "Vitality Institute", category: "Services", sub: "Peels", type: ProductType.CONSUMABLE, price: 350, uom: "each", sku: "111100000143" },
    { name: "Vitalize Peel", vendor: "SkinMedica", category: "Services", sub: "Peels", type: ProductType.CONSUMABLE, price: 175, uom: "each", sku: "94942" },
    { name: "Vitamin C Pro Infusion Serum", vendor: "SkinMedica", category: "Services", sub: "Diamond Glow", type: ProductType.CONSUMABLE, price: 0, uom: "each", sku: "111100000107" },
    { name: "Xeomin", vendor: "Merz Aesthetics", category: "Services", sub: "Injectables", type: ProductType.CONSUMABLE, price: 5.11, uom: "each", sku: "111100000101" },
    { name: "Xtressé", vendor: "Xtressé", category: "Wellness", sub: "Hair Growth", type: ProductType.RETAIL, price: 78, uom: "each", sku: "111100000172" },
  ];

  let productCount = 0;
  for (const p of productData) {
    if (!p.vendor) {
      console.warn(`  ⚠ Skipped product "${p.name}" — no vendor`);
      continue;
    }
    const vendor = v(p.vendor);
    const category = cat(p.category);
    if (!vendor || !category) {
      console.warn(`  ⚠ Skipped "${p.name}" — vendor "${p.vendor}" ${vendor ? "found" : "NOT FOUND"}, category "${p.category}" ${category ? "found" : "NOT FOUND"}`);
      continue;
    }
    await prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku || null,
        vendorId: vendor.id,
        categoryId: category.id,
        productType: p.type,
        subCategory: p.sub,
        unitPrice: p.price,
        unitOfMeasure: p.uom,
      },
    });
    productCount++;
  }
  console.log(`✓ ${productCount} products seeded`);

  // ── Users ──────────────────────────────────────────
  const pw = await hash("password123", 12);

  const userData = [
    { email: "clay@secretmedspa.com", name: "Clay Magnuson", role: Role.ADMIN, locationCode: null as string | null },
    { email: "purchasing@secretmedspa.com", name: "Garrett Gay", role: Role.PURCHASER, locationCode: null as string | null },
    { email: "manager.atx@itsasecret.com", name: "ATX Manager", role: Role.MANAGER, locationCode: "ATX" },
    { email: "manager.dal@itsasecret.com", name: "DAL Manager", role: Role.MANAGER, locationCode: "DAL" },
    { email: "manager.hou@itsasecret.com", name: "HOU Manager", role: Role.MANAGER, locationCode: "HOU" },
    { email: "manager.phx@itsasecret.com", name: "PHX Manager", role: Role.MANAGER, locationCode: "SCOTT" },
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
  const emp1 = users.find((u) => u.email === "employee1@itsasecret.com")!;
  const emp2 = users.find((u) => u.email === "employee2@itsasecret.com")!;
  const emp3 = users.find((u) => u.email === "employee3@itsasecret.com")!;
  const mgrAtx = users.find((u) => u.email === "manager.atx@itsasecret.com")!;

  const allerganV = vendors.find((x) => x.code === "ALLERGAN")!;
  const galdermaV = vendors.find((x) => x.code === "GALDERMA")!;
  const hydrafacialV = vendors.find((x) => x.code === "HYDRAFACIAL")!;
  const skinmedV = vendors.find((x) => x.code === "SKINMEDICA")!;

  const atx = locations.find((l) => l.code === "ATX")!;
  const dal = locations.find((l) => l.code === "DAL")!;
  const hou = locations.find((l) => l.code === "HOU")!;

  const allProducts = await prisma.product.findMany();
  const findProduct = (name: string) => allProducts.find((p) => p.name.includes(name))!;

  // PO 1: Delivered — Botox + Juvederm
  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2026-0001",
      locationId: atx.id,
      requestedById: emp1.id,
      vendorId: allerganV.id,
      status: OrderStatus.DELIVERED,
      priority: Priority.NORMAL,
      totalAmount: 210,
      requestedAt: new Date("2026-02-01"),
      approvedAt: new Date("2026-02-01"),
      orderedAt: new Date("2026-02-02"),
      deliveredAt: new Date("2026-02-05"),
      items: {
        create: [
          { name: "Botox", productId: findProduct("Botox").id, quantity: 10, unitPrice: 13.5, totalPrice: 135 },
          { name: "Juvederm Ultra XC", productId: findProduct("Juvederm Ultra XC").id, quantity: 1, unitPrice: 70, totalPrice: 70 },
        ],
      },
      approvals: {
        create: { userId: mgrAtx.id, action: "APPROVED", notes: "Routine restock" },
      },
    },
  });

  // PO 2: Approved — Galderma fillers
  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2026-0002",
      locationId: dal.id,
      requestedById: emp2.id,
      vendorId: galdermaV.id,
      status: OrderStatus.APPROVED,
      priority: Priority.HIGH,
      totalAmount: 355,
      requestedAt: new Date("2026-02-20"),
      approvedAt: new Date("2026-02-20"),
      items: {
        create: [
          { name: "Dysport", productId: findProduct("Dysport").id, quantity: 5, unitPrice: 4, totalPrice: 20 },
          { name: "Restylane Kysse", productId: findProduct("Restylane Kysse").id, quantity: 3, unitPrice: 82, totalPrice: 246 },
          { name: "Restylane Defyne", productId: findProduct("Restylane Defyne").id, quantity: 1, unitPrice: 70, totalPrice: 70 },
        ],
      },
    },
  });

  // PO 3: Pending approval — HydraFacial supplies
  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2026-0003",
      locationId: hou.id,
      requestedById: emp3.id,
      vendorId: hydrafacialV.id,
      status: OrderStatus.PENDING_APPROVAL,
      priority: Priority.NORMAL,
      totalAmount: 0,
      requestedAt: new Date("2026-02-25"),
      items: {
        create: [
          { name: "Hydropeel Tip, Blue 15-Pack", productId: findProduct("Hydropeel Tip, Blue").id, quantity: 2, unitPrice: 0, totalPrice: 0 },
          { name: "Activ-4 Skin Solution, 8 oz. bottle", productId: findProduct("Activ-4 Skin Solution").id, quantity: 3, unitPrice: 0, totalPrice: 0 },
        ],
      },
    },
  });

  // PO 4: Draft — SkinMedica retail
  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2026-0004",
      locationId: atx.id,
      requestedById: emp1.id,
      vendorId: skinmedV.id,
      status: OrderStatus.DRAFT,
      priority: Priority.LOW,
      totalAmount: 476,
      items: {
        create: [
          { name: "TNS A+", productId: findProduct("TNS A+").id, quantity: 1, unitPrice: 295, totalPrice: 295 },
          { name: "HA5 Rejuvenating Hydrator 2oz", productId: findProduct("HA5 Rejuvenating Hydrator").id, quantity: 1, unitPrice: 184, totalPrice: 184 },
        ],
      },
    },
  });

  // PO 5: Cancelled
  await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-2026-0005",
      locationId: dal.id,
      requestedById: emp2.id,
      vendorId: galdermaV.id,
      status: OrderStatus.CANCELLED,
      priority: Priority.NORMAL,
      totalAmount: 20,
      cancelledAt: new Date("2026-02-18"),
      requestedAt: new Date("2026-02-15"),
      items: {
        create: [
          { name: "Dysport", productId: findProduct("Dysport").id, quantity: 5, unitPrice: 4, totalPrice: 20 },
        ],
      },
      approvals: {
        create: { userId: admin.id, action: "REJECTED", notes: "Duplicate order — already placed last week" },
      },
    },
  });

  console.log(`✓ 5 sample purchase orders seeded`);

  // ── Par Levels (consumable/both products at key locations) ──
  const parLevelData = [
    // ATX - Austin — Injectables
    { productName: "Botox", locationCode: "ATX", min: 10, max: 20, current: 8 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", min: 8, max: 15, current: 3 },
    { productName: "Juvederm Voluma", locationCode: "ATX", min: 5, max: 10, current: 6 },
    { productName: "Dysport", locationCode: "ATX", min: 6, max: 12, current: 7 },
    { productName: "Restylane Kysse", locationCode: "ATX", min: 4, max: 8, current: 5 },
    // ATX - Hydrafacial supplies
    { productName: "Hydropeel Tip, Blue", locationCode: "ATX", min: 2, max: 5, current: 3 },
    { productName: "Activ-4 Skin Solution", locationCode: "ATX", min: 2, max: 4, current: 1 },
    // ATX - Peels
    { productName: "VI Peel Original", locationCode: "ATX", min: 3, max: 6, current: 4 },
    { productName: "Illuminize Peel", locationCode: "ATX", min: 2, max: 5, current: 2 },
    // ATX - Morpheus
    { productName: "Morpheus8 24 Pin Tip", locationCode: "ATX", min: 3, max: 8, current: 5 },
    // ATX - Backbar
    { productName: "BACKBAR - HA5 Hydra Collagen", locationCode: "ATX", min: 1, max: 3, current: 2 },
    { productName: "BACKBAR - Facial Cleanser", locationCode: "ATX", min: 1, max: 3, current: 1 },

    // DAL - Dallas
    { productName: "Botox", locationCode: "DAL", min: 12, max: 24, current: 15 },
    { productName: "Juvederm Ultra XC", locationCode: "DAL", min: 6, max: 12, current: 8 },
    { productName: "Dysport", locationCode: "DAL", min: 8, max: 16, current: 2 },
    { productName: "Sculptra", locationCode: "DAL", min: 4, max: 8, current: 5 },
    { productName: "Restylane Defyne", locationCode: "DAL", min: 4, max: 8, current: 6 },
    { productName: "Restylane-L", locationCode: "DAL", min: 4, max: 8, current: 7 },
    { productName: "Xeomin", locationCode: "DAL", min: 3, max: 6, current: 4 },
    { productName: "Morpheus8 24 Pin Tip", locationCode: "DAL", min: 3, max: 6, current: 1 },

    // HOU - Houston
    { productName: "Botox", locationCode: "HOU", min: 8, max: 16, current: 10 },
    { productName: "Restylane Kysse", locationCode: "HOU", min: 4, max: 8, current: 4 },
    { productName: "Restylane Lyft", locationCode: "HOU", min: 3, max: 6, current: 2 },
    { productName: "Hydropeel Tip, Blue", locationCode: "HOU", min: 2, max: 4, current: 1 },
    { productName: "Morpheus8 24 Pin Tip", locationCode: "HOU", min: 2, max: 4, current: 1 },
    { productName: "Activ-4 Skin Solution", locationCode: "HOU", min: 2, max: 4, current: 3 },
  ];

  let parCount = 0;
  for (const pl of parLevelData) {
    const product = allProducts.find((p) => p.name.includes(pl.productName));
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
  const countHistory = [
    // Botox at ATX — steady decline
    { productName: "Botox", locationCode: "ATX", weeksAgo: 6, qty: 18 },
    { productName: "Botox", locationCode: "ATX", weeksAgo: 5, qty: 16 },
    { productName: "Botox", locationCode: "ATX", weeksAgo: 4, qty: 14 },
    { productName: "Botox", locationCode: "ATX", weeksAgo: 3, qty: 12 },
    { productName: "Botox", locationCode: "ATX", weeksAgo: 2, qty: 11 },
    { productName: "Botox", locationCode: "ATX", weeksAgo: 1, qty: 8 },

    // Juvederm Ultra XC at ATX — moderate decline
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 6, qty: 10 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 5, qty: 9 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 4, qty: 7 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 3, qty: 6 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 2, qty: 5 },
    { productName: "Juvederm Ultra XC", locationCode: "ATX", weeksAgo: 1, qty: 3 },

    // Dysport at DAL — sharp decline
    { productName: "Dysport", locationCode: "DAL", weeksAgo: 5, qty: 14 },
    { productName: "Dysport", locationCode: "DAL", weeksAgo: 4, qty: 10 },
    { productName: "Dysport", locationCode: "DAL", weeksAgo: 3, qty: 7 },
    { productName: "Dysport", locationCode: "DAL", weeksAgo: 2, qty: 4 },
    { productName: "Dysport", locationCode: "DAL", weeksAgo: 1, qty: 2 },

    // Botox at DAL — stable
    { productName: "Botox", locationCode: "DAL", weeksAgo: 4, qty: 20 },
    { productName: "Botox", locationCode: "DAL", weeksAgo: 3, qty: 18 },
    { productName: "Botox", locationCode: "DAL", weeksAgo: 2, qty: 17 },
    { productName: "Botox", locationCode: "DAL", weeksAgo: 1, qty: 15 },

    // Restylane Kysse at HOU — declining
    { productName: "Restylane Kysse", locationCode: "HOU", weeksAgo: 5, qty: 10 },
    { productName: "Restylane Kysse", locationCode: "HOU", weeksAgo: 4, qty: 8 },
    { productName: "Restylane Kysse", locationCode: "HOU", weeksAgo: 3, qty: 7 },
    { productName: "Restylane Kysse", locationCode: "HOU", weeksAgo: 2, qty: 5 },
    { productName: "Restylane Kysse", locationCode: "HOU", weeksAgo: 1, qty: 4 },
  ];

  let countNum = 0;
  for (const ch of countHistory) {
    const product = allProducts.find((p) => p.name.includes(ch.productName));
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
