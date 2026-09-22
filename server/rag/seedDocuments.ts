export interface SeedDoc {
  id: string;
  document_name: string;
  document_type: 'brochure' | 'pricing_sheet' | 'floor_plan' | 'faq' | 'project_update' | 'legal_rera';
  property_name: string;
  version: string;
  publication_date: string;
  content: string;
}

export const SEED_DOCUMENTS: SeedDoc[] = [
  {
    id: "doc_gv_brochure_v1",
    document_name: "Green Valley Residency — Master Brochure (Jan 2026)",
    document_type: "brochure",
    property_name: "Green Valley Residency",
    version: "1.0",
    publication_date: "2026-01-15",
    content: `# Green Valley Residency — Project Overview & Brochure
[Page 1]
Developer: Green Valley Developers & Infrastructure Ltd.
Project Location: Sector 84, Outer Ring Road Corridor, Bengaluru.
Total Land Parcel: 14.5 Acres, 78% open landscaped green space.
Total Towers: 6 Towers (Towers A through F), G+24 floors each.
RERA Registration Number: PRM/KA/RERA/1251/310/PR/210420/004128.

[Page 2]
### Project Phases & Timelines
- Phase 1 (Towers A, B & C): Total 360 units. Construction 100% completed. Occupancy Certificate (OC) received. Handover commenced December 2024.
- Phase 2 (Towers D, E & F): Total 360 units. RCC superstructure 85% completed. According to the Phase 2 project document, possession is expected in December 2026.

[Page 3]
### World-Class Amenities
- Club Verdant: 18,000 sq ft central clubhouse with temperature-controlled indoor squash courts and dual badminton arenas.
- Olympic-length swimming pool (50 meters) with dedicated toddler splash deck and poolside cabanas.
- Fully equipped gym featuring TechnoGym equipment, aerobic studio, and dedicated yoga lawn.
- Multi-tier 24/7 security with RFID vehicular access, biometric tower lobby entries, and 450+ CCTV surveillance network.
- 1.2 km jogging track, organic community garden, pet recreation park, and amphitheater.

[Page 4]
### Location Connectivity
- Kempegowda International Airport: 28 km (approx. 35 mins via Airport Expressway).
- Central Tech Park: 3.5 km.
- Metro Line 4 Station (Kadubeesanahalli): 1.2 km.
- Reputed schools (Inventure Academy, Greenwood High): Within 5 km radius.
- Healthcare (Manipal Hospital, Sakra World Hospital): 4 km radius.`
  },
  {
    id: "doc_gv_schedule_update",
    document_name: "Green Valley Phase 2 — Project Progress & Schedule Update (June 2026)",
    document_type: "project_update",
    property_name: "Green Valley Residency",
    version: "2.1",
    publication_date: "2026-06-10",
    content: `# Green Valley Residency — Phase 2 Construction Status & Schedule Revision
[Page 1]
Document Date: June 10, 2026
Issued by: Chief Project Engineer & Quality Audit Cell.

### Construction Status Report
- Tower D: Structure completed up to 24th floor; internal plastering and plumbing 75% complete.
- Tower E: Structure completed up to 22nd floor; electrical conduit installation active.
- Tower F: Structure completed up to 20th floor; brickwork in progress.

### Possession Date Notice
Due to municipal metro feeder corridor road widening and government utility line re-routing along Sector 84 access avenue, the project handover schedule has been updated.
- Original Estimated Possession: December 2026
- Revised Expected Possession Date for Phase 2: March 2027.
Notice: The developer has filed the formal RERA extension notification under Section 6 with no price escalation for existing booked buyers.`
  },
  {
    id: "doc_gv_pricing_sheet",
    document_name: "Green Valley Residency — Official Cost Sheet & Payment Plan (Q1 2026)",
    document_type: "pricing_sheet",
    property_name: "Green Valley Residency",
    version: "1.4",
    publication_date: "2026-02-01",
    content: `# Green Valley Residency — Unit Pricing & Cost Sheet
[Page 1]
### Unit Pricing (Base Selling Price)
| Configuration | Super Built-up Area | Carpet Area | Base Price | Approximate All-Inclusive Price |
| --- | --- | --- | --- | --- |
| 2 BHK Classic | 1,250 sq ft | 920 sq ft | ₹95 lakh | ₹1.05 crore |
| 2 BHK Luxury (with study) | 1,420 sq ft | 1,050 sq ft | ₹1.12 crore | ₹1.24 crore |
| 3 BHK Premium | 1,850 sq ft | 1,420 sq ft | ₹1.45 crore | ₹1.62 crore |
| 3 BHK Royal (with servant room) | 2,150 sq ft | 1,650 sq ft | ₹1.72 crore | ₹1.92 crore |
| 4 BHK Sky Villa | 2,900 sq ft | 2,240 sq ft | ₹2.60 crore | ₹2.90 crore |

[Page 2]
### Construction-Linked Payment Plan (CLP) - Phase 2
- Booking Amount: 10% of Total Agreement Value upon booking.
- Execution of Agreement for Sale: 10% within 30 days of booking.
- Completion of Foundation & Basement: 15%.
- Completion of 10th Floor Slab: 15%.
- Completion of 20th Floor Slab: 15%.
- Completion of Terrace Slab & External Plaster: 15%.
- Completion of Flooring & Internal Finishes: 10%.
- On Notice of Possession: 10% + Club membership fees + Stamp Duty & Registration.

### Car Parking Charges & Allocation
- 2 BHK Units: 1 covered stilt parking slot included in base pricing.
- 3 BHK & 4 BHK Units: 2 covered basement parking slots included in base pricing.
- Additional EV-equipped parking slot available on request for ₹3.5 lakh.`
  },
  {
    id: "doc_gv_faq",
    document_name: "Green Valley Residency — Resident & Buyer FAQs",
    document_type: "faq",
    property_name: "Green Valley Residency",
    version: "1.2",
    publication_date: "2026-01-20",
    content: `# Green Valley Residency — Frequently Asked Questions (FAQs)
Q: What is the carpet area of the 2 BHK and 3 BHK apartments?
**A:** In Green Valley Residency, the 2 BHK Classic has a carpet area of 920 sq ft (Super Built-up Area: 1,250 sq ft). The 3 BHK Premium has a carpet area of 1,420 sq ft (Super Built-up Area: 1,850 sq ft).

Q: What is the starting price for apartments in Green Valley?
**A:** Starting price for Green Valley Residency is ₹95 lakh for the 2 BHK Classic configuration.

Q: Which banks have approved Green Valley Residency for home loans?
**A:** The project is pre-approved for fast-track home loans by State Bank of India (SBI), HDFC Bank, ICICI Bank, Axis Bank, and Kotak Mahindra Bank with interest concessions for women buyers.

Q: Are pets allowed in the residential community?
**A:** Yes, Green Valley is a pet-friendly community allowing up to 2 domestic pets per apartment, with a dedicated pet recreation park located next to Tower C.

Q: Is there power backup in the apartments?
**A:** Yes, 100% DG power backup is provided for all common areas and up to 3 kW power backup per 2 BHK apartment and 5 kW for 3 BHK and 4 BHK apartments, sufficient to power air-conditioners and refrigerators.

Q: Does Green Valley Residency have a swimming pool?
**A:** Yes, the project features a 50-meter Olympic-length swimming pool, an indoor temperature-controlled pool at Club Verdant, and a separate toddler splash deck.`
  },
  {
    id: "doc_skyline_brochure",
    document_name: "Skyline Heights — Master Brochure & Specifications (March 2026)",
    document_type: "brochure",
    property_name: "Skyline Heights",
    version: "1.0",
    publication_date: "2026-03-05",
    content: `# Skyline Heights — Urban High-Rise Living
[Page 1]
Developer: Skyline Horizon Infra LLP.
Location: Financial District, Gachibowli, Hyderabad.
Total Land Parcel: 8.2 Acres.
Architectural Design: Hafeez Contractor.
RERA Registration Number: PRM/TS/RERA/2023/1109.
Towers: 4 Towers (Towers Alpha, Beta, Gamma, Delta), G+32 Floors.

[Page 2]
### Possession & Delivery Timelines
- All 4 towers in Skyline Heights are being constructed in a single phase.
- Possession Date: Expected in September 2027.
- Current Status: 14th floor slab casting completed across Towers Alpha and Beta.

[Page 3]
### Available Configurations & Pricing
- 2 BHK Urban Luxe: 1,150 sq ft super built-up, carpet area 840 sq ft. Starting price: ₹1.10 crore.
- 3 BHK Grand Horizon: 1,720 sq ft super built-up, carpet area 1,290 sq ft. Starting price: ₹1.75 crore.
- 3 BHK Panoramic: 2,050 sq ft super built-up, carpet area 1,560 sq ft with double-height balcony. Starting price: ₹2.10 crore.

[Page 4]
### Signature Amenities
- Sky Observatory & Telescope Deck on the 32nd floor terrace.
- Heated indoor glass-encased pool with infinity edge.
- Dedicated co-working business center with soundproof podcast booths and high-speed fiber optics.
- Automated EV charging station for every individual parking bay.
- Squash court, rooftop padel court, and 12-seater private mini-theatre.`
  },
  {
    id: "doc_azure_bay",
    document_name: "Azure Bay Luxury Residences — Coastal Living Brochure",
    document_type: "brochure",
    property_name: "Azure Bay Luxury Residences",
    version: "1.1",
    publication_date: "2026-01-10",
    content: `# Azure Bay Luxury Residences — Signature Waterfront Living
[Page 1]
Developer: Azure Blue Real Estate Holdings.
Location: East Coast Road (ECR), Chennai.
Project Type: Ultra-luxury waterfront duplexes and private villas.
RERA Registration: TN/01/Building/0192/2023.

[Page 2]
### Unit Specifications & Pricing
- 3 BHK Beachfront Duplex: 3,100 sq ft, private plunge pool, panoramic ocean view. Price: ₹3.20 crore.
- 4 BHK Ocean Villa: 4,800 sq ft, private landscaped lawn and 2-car garage. Price: ₹5.50 crore.
- Possession Date: Expected in November 2026. Handover on schedule.

[Page 3]
### Amenities
- Private marina access and yacht mooring rights for villa owners.
- Saltwater horizon pool facing the Bay of Bengal.
- Wellness spa with Ayurvedic treatment suites and sea-facing yoga pavilion.`
  }
];
