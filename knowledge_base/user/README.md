# User Knowledge Base

This folder structure represents user-specific data stored in Supabase/Vectors.

**Storage:** Supabase + PGVector (not files in repo)

## Categories

| Folder | Description | Example Data |
|--------|-------------|--------------|
| `website/` | Website analysis data | Company info extracted from website |
| `social_media/` | Social media profiles & content | LinkedIn, Twitter, Instagram data |
| `branding/` | Brand identity & voice | Logo, colors, tone, messaging |
| `company/` | Company overview | Mission, vision, history, location |
| `products/` | Products & services | Catalog, pricing, features |
| `contacts/` | Contacts & stakeholders | Team members, partners, vendors |
| `sales/` | Sales process & pipeline | Scripts, objections, stages |
| `marketing/` | Marketing channels & campaigns | Active channels, strategies |
| `operations/` | Internal workflows | SOPs, meeting schedules |
| `competitive/` | Competitive landscape | Competitors, differentiation |

## How It Works

1. **N8N saves data** using FK-RAG workflow with category metadata
2. **Data stored** in PGVector with `user_id` + `category` filters
3. **Agents retrieve** relevant data using Vector Search tool
4. **Users can update** via chat ("Update my phone number to...")
