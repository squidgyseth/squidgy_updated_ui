import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  description: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  company_name?: string;
  company_address?: string;
  customer_name?: string;
  customer_email?: string;
}

export class InvoiceStorageService {
  private static readonly BUCKET_NAME = 'invoices';

  /**
   * Generate a simple HTML invoice template
   */
  private static generateInvoiceHTML(invoiceData: InvoiceData): string {
    const { 
      invoice_number, 
      invoice_date, 
      due_date, 
      amount, 
      currency, 
      description,
      line_items,
      company_name = 'Squidgy AI',
      company_address = '123 Business Street, Suite 100\nSan Francisco, CA 94105',
      customer_name = 'Valued Customer',
      customer_email = 'customer@example.com'
    } = invoiceData;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice ${invoice_number}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f8f9fa;
        }
        .invoice-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px; 
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #6366f1;
            padding-bottom: 20px;
        }
        .company-info h1 { 
            color: #6366f1; 
            margin: 0; 
            font-size: 28px;
        }
        .company-info p { 
            margin: 5px 0; 
            color: #666; 
            white-space: pre-line;
        }
        .invoice-info { 
            text-align: right; 
        }
        .invoice-info h2 { 
            color: #333; 
            margin: 0 0 10px 0; 
            font-size: 24px;
        }
        .invoice-info p { 
            margin: 5px 0; 
            color: #666; 
        }
        .billing-section { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 40px; 
        }
        .billing-to, .invoice-details { 
            width: 48%; 
        }
        .billing-to h3, .invoice-details h3 { 
            color: #333; 
            margin-bottom: 15px; 
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .billing-to p, .invoice-details p { 
            margin: 8px 0; 
            color: #666; 
        }
        .line-items { 
            margin-bottom: 30px; 
        }
        .line-items table { 
            width: 100%; 
            border-collapse: collapse; 
            border: 1px solid #e2e8f0;
        }
        .line-items th { 
            background: #f8fafc; 
            padding: 15px; 
            text-align: left; 
            border-bottom: 2px solid #e2e8f0;
            color: #374151;
            font-weight: 600;
        }
        .line-items td { 
            padding: 15px; 
            border-bottom: 1px solid #e2e8f0; 
            color: #4b5563;
        }
        .line-items tr:hover { 
            background: #f9fafb; 
        }
        .total-section { 
            text-align: right; 
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
        }
        .total-amount { 
            font-size: 24px; 
            font-weight: bold; 
            color: #059669; 
            margin-top: 10px;
        }
        .footer { 
            margin-top: 50px; 
            padding-top: 30px; 
            border-top: 1px solid #e2e8f0; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px;
        }
        @media print {
            body { background: white; }
            .invoice-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                <h1>${company_name}</h1>
                <p>${company_address}</p>
            </div>
            <div class="invoice-info">
                <h2>INVOICE</h2>
                <p><strong>Invoice #:</strong> ${invoice_number}</p>
                <p><strong>Date:</strong> ${new Date(invoice_date).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(due_date).toLocaleDateString()}</p>
            </div>
        </div>
        
        <div class="billing-section">
            <div class="billing-to">
                <h3>Bill To:</h3>
                <p><strong>${customer_name}</strong></p>
                <p>${customer_email}</p>
            </div>
            <div class="invoice-details">
                <h3>Invoice Details:</h3>
                <p><strong>Description:</strong> ${description}</p>
                <p><strong>Currency:</strong> ${currency}</p>
            </div>
        </div>
        
        <div class="line-items">
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${line_items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>$${item.unit_price.toFixed(2)}</td>
                            <td>$${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="total-section">
            <div class="total-amount">
                Total: $${amount.toFixed(2)} ${currency}
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>Questions about this invoice? Contact us at support@squidgy.ai</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate PDF from HTML content
   */
  private static async generatePDFFromHTML(htmlContent: string): Promise<Blob | null> {
    try {
      // Create a temporary div to render HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);

      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit A4
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Convert PDF to blob
      const pdfBlob = pdf.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  }

  /**
   * Generate and upload invoice PDF to Supabase storage
   */
  static async generateAndUploadInvoice(
    invoiceData: InvoiceData, 
    userId: string, 
    companyId: string
  ): Promise<string | null> {
    try {
      // Generate HTML content
      const htmlContent = this.generateInvoiceHTML(invoiceData);
      
      // Generate PDF blob from HTML
      const pdfBlob = await this.generatePDFFromHTML(htmlContent);
      
      if (!pdfBlob) {
        console.error('Failed to generate PDF blob');
        return null;
      }
      
      // Create file path with .pdf extension
      const fileName = `${companyId}/${userId}/${invoiceData.invoice_number}.pdf`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) {
        console.error('Error uploading invoice:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error generating invoice:', error);
      return null;
    }
  }

  /**
   * Get invoice URL from storage
   */
  static async getInvoiceUrl(filePath: string): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting invoice URL:', error);
      return null;
    }
  }

  /**
   * Delete invoice from storage
   */
  static async deleteInvoice(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting invoice:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return false;
    }
  }

  /**
   * Generate file path for invoice
   */
  static generateFilePath(companyId: string, userId: string, invoiceNumber: string): string {
    return `${companyId}/${userId}/${invoiceNumber}.pdf`;
  }
}