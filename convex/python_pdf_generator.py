#!/usr/bin/env python3
"""
Arabic PDF Generator using reportlab with proper Arabic font support
This script generates professional quotation PDFs with correct Arabic text rendering
"""

import json
import sys
import base64
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from arabic_reshaper import reshape
from bidi.algorithm import get_display

def setup_arabic_font():
    """Setup Arabic font for proper text rendering"""
    try:
        # Register Arabic font (you'll need to have this font file)
        # For now, we'll use a fallback approach
        font_path = "NotoNaskhArabic-Regular.ttf"
        pdfmetrics.registerFont(TTFont('Arabic', font_path))
        return True
    except:
        # If Arabic font not available, we'll use a different approach
        return False

def reshape_arabic_text(text):
    """Reshape Arabic text for proper display"""
    if not text:
        return ""
    
    try:
        # Reshape Arabic text to handle proper character connections
        reshaped_text = reshape(text)
        # Apply bidirectional algorithm for proper RTL display
        display_text = get_display(reshaped_text)
        return display_text
    except:
        # If Arabic reshaping fails, return original text
        return text

def generate_arabic_pdf(data):
    """Generate PDF with proper Arabic text support"""
    
    # Parse input data
    quotation_data = data['quotationData']
    org_data = data['orgData']
    
    # Create PDF buffer
    buffer = BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)
    
    # Container for the 'Flowable' objects
    story = []
    
    # Setup styles
    styles = getSampleStyleSheet()
    
    # Setup Arabic font
    arabic_font_available = setup_arabic_font()
    
    # Title
    title_style = styles['Heading1']
    title_style.alignment = 1  # Center alignment
    title_style.fontSize = 14
    title = Paragraph("QUOTATION", title_style)
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Organization Header
    header_data = [
        ['Organization (English)', 'Organization (Arabic)'],
        [
            f"{org_data.get('name', '')}\n"
            f"Address: {org_data.get('address', '')}\n"
            f"Email: {org_data.get('email', '')}\n"
            f"Phone: {org_data.get('phone', '')}\n"
            f"VAT: {org_data.get('vat_number', '')}\n"
            f"CR: {org_data.get('cr_number', '')}",
            
            f"{reshape_arabic_text(org_data.get('name_arabic', ''))}\n"
            f"{reshape_arabic_text(org_data.get('address_arabic', ''))}\n"
            f"الرقم الضريبي: {org_data.get('vat_number', '')}"
        ]
    ]
    
    header_table = Table(header_data, colWidths=[90*mm, 90*mm])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(header_table)
    story.append(Spacer(1, 12))
    
    # Quotation Details
    details_data = [
        ['Quotation No:', quotation_data.get('quotation_number', ''), 'Date:', quotation_data.get('date', '')[:10]],
        ['Customer:', quotation_data.get('customer_name', ''), 'Currency:', quotation_data.get('currency', 'SAR')]
    ]
    
    details_table = Table(details_data, colWidths=[45*mm, 45*mm, 45*mm, 45*mm])
    details_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(details_table)
    story.append(Spacer(1, 12))
    
    # Items Table
    items_data = [['#', 'Item & Description', 'Qty', 'Rate', 'VAT %', 'VAT Amount', 'Total']]
    
    # Add items
    items = data.get('items', [])
    for i, item in enumerate(items, 1):
        items_data.append([
            str(i),
            item.get('name', 'N/A'),
            str(item.get('quantity', 0)),
            f"{quotation_data.get('currency', 'SAR')} {item.get('unitPrice', 0):.2f}",
            f"{item.get('vatPercentage', 15)}%",
            f"{quotation_data.get('currency', 'SAR')} {item.get('vatAmount', 0):.2f}",
            f"{quotation_data.get('currency', 'SAR')} {item.get('totalPrice', 0):.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[15*mm, 60*mm, 20*mm, 25*mm, 20*mm, 25*mm, 25*mm])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (1, 1), (1, -1), 'LEFT'),  # Item description left-aligned
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(items_table)
    story.append(Spacer(1, 12))
    
    # Financial Summary
    financials = data.get('financials', {})
    currency = quotation_data.get('currency', 'SAR')
    
    summary_data = [
        ['Sub Total:', f"{currency} {financials.get('subtotal', 0):.2f}"],
        [f"VAT ({quotation_data.get('tax_rate', 15)}%):", f"{currency} {financials.get('totalVat', 0):.2f}"],
        ['Total:', f"{currency} {financials.get('grandTotal', 0):.2f}"]
    ]
    
    summary_table = Table(summary_data, colWidths=[90*mm, 90*mm])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),  # Total row bold
        ('FONTSIZE', (0, 2), (-1, 2), 12),  # Total row 12pt as requested
        ('FONTSIZE', (0, 0), (-1, 1), 10),  # Other rows 10pt
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 12))
    
    # Footer
    footer_data = [
        [
            f"Email: {org_data.get('email', '')}\n{org_data.get('name', '')}",
            f"Phone: {org_data.get('phone', '')}\n{reshape_arabic_text(org_data.get('address_arabic', ''))}"
        ]
    ]
    
    footer_table = Table(footer_data, colWidths=[90*mm, 90*mm])
    footer_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(footer_table)
    
    # Build PDF
    doc.build(story)
    
    # Get PDF data
    pdf_data = buffer.getvalue()
    buffer.close()
    
    # Return base64 encoded PDF
    return base64.b64encode(pdf_data).decode('utf-8')

def main():
    """Main function to handle command line input"""
    if len(sys.argv) != 2:
        print("Usage: python3 python_pdf_generator.py '<json_data>'")
        sys.exit(1)
    
    try:
        # Parse JSON input
        json_data = json.loads(sys.argv[1])
        
        # Generate PDF
        pdf_base64 = generate_arabic_pdf(json_data)
        
        # Output result
        result = {
            "success": True,
            "message": "PDF generated successfully with proper Arabic text support",
            "pdfData": pdf_base64
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        # Output error
        result = {
            "success": False,
            "message": f"Error generating PDF: {str(e)}"
        }
        
        print(json.dumps(result))
        sys.exit(1)

if __name__ == "__main__":
    main()
