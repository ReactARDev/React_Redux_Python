import tempfile

from pdfrw import PdfReader, PdfWriter

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageTemplate, Frame
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.rl_config import defaultPageSize
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import letter

PAGE_WIDTH=letter[0]
PAGE_HEIGHT=letter[1]
LOGO_ASPECT_RATIO=2312.0/510
TABLE_WIDTH=6*inch
styles = getSampleStyleSheet()

def create_cover_page(title, table_contents, text_para=None, file_obj=None):
    if file_obj is None:
        file_obj = tempfile.TemporaryFile(suffix='.pdf')

    # this is all kind of weird, stolen from here: http://stackoverflow.com/a/11942346/1003950
    def footer(canvas, doc):
        canvas.saveState()
        P = Paragraph("(c) Compliance.ai. No claim to original U.S. Government Works.", styles['Normal'])
        w, h = P.wrap(doc.width, doc.bottomMargin)
        P.drawOn(canvas, doc.leftMargin, h)
        canvas.restoreState()


    pdf_doc = SimpleDocTemplate(file_obj, pagesize=letter)
    frame = Frame(pdf_doc.leftMargin, pdf_doc.bottomMargin, pdf_doc.width, pdf_doc.height,id='normal')
    template = PageTemplate(id='cover', frames=frame, onPage=footer)
    pdf_doc.addPageTemplates([template])

    CoverPage = []

    CoverPage.append(
        Image(
            'assets/compliance_ai_logo_blk.png',
            width=int(5.0*inch),
            height=int((5.0/LOGO_ASPECT_RATIO)*inch)
        )
    )
    CoverPage.append(Spacer(1, 0.5*inch))

    CoverPage.append(Paragraph(title, styles['Title']))
    CoverPage.append(Spacer(1, 0.5*inch))

    if text_para:
        CoverPage.append(Paragraph(text_para, styles['Normal']))
        CoverPage.append(Spacer(1, 0.5*inch))

    num_cols = len(table_contents[0])
    table_col_widths = [ TABLE_WIDTH/num_cols for i in xrange(0, num_cols) ]

    # put the contents of all cells into a paragraph to ensure word wrap
    for (i, row) in enumerate(table_contents):
        new_row = []
        for (j, col) in enumerate(row):
            table_contents[i][j] = Paragraph(str(col), styles['Normal'])

    t = Table(table_contents, colWidths=table_col_widths)
    t.setStyle(TableStyle([
        ['VALIGN', (0,0), (-1,-1), 'TOP']
    ]))
    CoverPage.append(t)
    CoverPage.append(Spacer(1, 0.5*inch))

    pdf_doc.build(CoverPage)

    file_obj.flush()

    return file_obj

def add_cover_to_pdf(title, table_contents, pdf_contents, text_para=None, out_file_obj=None):
    cover_page_file = create_cover_page(title, table_contents, text_para=text_para)

    if out_file_obj is None:
        out_file_obj = tempfile.TemporaryFile(suffix='.pdf')

    writer = PdfWriter()

    cover_page_file.seek(0) # XXX hack to read cover page file correctly

    writer.addpages(PdfReader(cover_page_file).pages)
    writer.addpages(PdfReader(fdata=pdf_contents).pages)
    writer.write(out_file_obj)

    out_file_obj.flush()
    cover_page_file.close()

    return out_file_obj
