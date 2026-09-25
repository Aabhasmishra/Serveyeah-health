import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { StudentScreeningEntry } from '../types/student';
import { CAMP_DETAILS } from '../constants/campDetails';

export function generateHealthFormHtml(entry: StudentScreeningEntry): string {
  // Photo HTML
  const photoHtml = entry.photoUri || entry.photoBase64
    ? `<img src="${entry.photoBase64 ? `data:image/jpeg;base64,${entry.photoBase64}` : entry.photoUri}" alt="Student Photograph" style="width: 100%; height: 100%; object-fit: cover;" />`
    : `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 10pt; text-align: center; padding: 4px;">
        <span>Affix</span>
        <span>Student</span>
        <span>Photo</span>
       </div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Check-Up Form - ${entry.name || 'Student'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 20mm 15mm 20mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: "Times New Roman", Times, Georgia, serif;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.35;
      font-size: 12pt;
    }
    .form-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    .header-section {
      text-align: center;
      margin-bottom: 8px;
    }
    .org-title-1 {
      font-size: 15pt;
      font-weight: bold;
      color: #111827;
      margin: 0;
      word-break: keep-all;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .org-conjunction {
      font-size: 11pt;
      font-style: italic;
      margin: 2px 0;
    }
    .org-title-2 {
      font-size: 13pt;
      font-weight: bold;
      color: #111827;
      margin: 0 0 6px 0;
      word-break: keep-all;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .divider-line {
      border: none;
      border-top: 1.8px solid #000000;
      margin: 6px 0;
    }
    .camp-title {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 14pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-align: center;
      margin: 4px 0 2px 0;
    }
    .camp-date {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12pt;
      font-weight: bold;
      text-align: center;
      margin: 2px 0 4px 0;
    }
    .sub-section {
      text-align: center;
      margin: 4px 0;
      font-size: 11pt;
    }
    .sub-heading {
      font-style: italic;
      font-size: 10.5pt;
      margin: 3px 0 1px 0;
    }
    .association-name {
      font-weight: bold;
      font-size: 11.5pt;
      margin: 1px 0;
      word-break: keep-all;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .venue-title {
      font-weight: bold;
      font-size: 11.5pt;
      margin: 1px 0;
    }
    .venue-address {
      font-size: 11pt;
      margin: 1px 0;
      word-break: keep-all;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    /* Student details section */
    .student-section-wrapper {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 18px;
      gap: 16px;
    }
    .student-fields {
      flex: 1;
    }
    .photo-box-container {
      width: 105px;
      height: 125px;
      border: 1.5px solid #000000;
      border-radius: 2px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      flex-shrink: 0;
    }
    .field-row {
      display: flex;
      flex-direction: row;
      align-items: baseline;
      margin-bottom: 12px;
      width: 100%;
    }
    .field-item {
      display: flex;
      flex-direction: row;
      align-items: baseline;
    }
    .field-label {
      font-weight: normal;
      font-size: 12pt;
      white-space: nowrap;
      margin-right: 6px;
    }
    .field-line {
      flex: 1;
      border-bottom: 1px solid #000000;
      min-height: 18px;
      padding: 0 6px;
      font-family: Arial, sans-serif;
      font-size: 11pt;
      font-weight: bold;
      color: #111827;
      word-break: keep-all;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    /* Clinical Evaluation */
    .medical-section {
      margin-top: 24px;
    }
    .medical-block {
      margin-bottom: 24px;
    }
    .medical-label {
      font-size: 12.5pt;
      font-weight: normal;
      margin-bottom: 6px;
    }
    .medical-value {
      font-family: Arial, sans-serif;
      font-size: 11.5pt;
      font-weight: 500;
      min-height: 38px;
      padding: 6px 10px;
      border-bottom: 1px solid #cbd5e1;
      background-color: #fafbfc;
      line-height: 1.5;
      word-break: keep-all;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    .advice-block {
      margin-top: 20px;
    }
    .advice-value {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      min-height: 60px;
      padding: 8px 10px;
      border-bottom: 1px solid #cbd5e1;
      background-color: #fafbfc;
      line-height: 1.5;
      word-break: keep-all;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    /* Footer / Signature */
    .signatures-row {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding: 0 10px;
    }
    .signature-col {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 1px solid #000000;
      margin-bottom: 6px;
    }
    .signature-title {
      font-size: 10pt;
      font-weight: bold;
    }

    .meta-footer {
      margin-top: 40px;
      padding-top: 8px;
      border-top: 0.5px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #94a3b8;
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <!-- Hospital & Education Centre Header -->
    <div class="header-section">
      <div class="org-title-1">${CAMP_DETAILS.institution1}</div>
      <div class="org-conjunction">${CAMP_DETAILS.conjunction}</div>
      <div class="org-title-2">${CAMP_DETAILS.institution2}</div>
    </div>

    <div class="divider-line"></div>
    <div class="camp-title">${CAMP_DETAILS.campTitle}</div>
    <div class="camp-date">${CAMP_DETAILS.campDate}</div>
    <div class="divider-line"></div>

    <!-- Association & Venue -->
    <div class="sub-section">
      <div class="sub-heading">${CAMP_DETAILS.associationLabel}</div>
      <div class="association-name">${CAMP_DETAILS.associations[0]}</div>
      <div class="association-name">${CAMP_DETAILS.associations[1]}</div>
    </div>

    <div class="sub-section" style="margin-top: 6px;">
      <div class="sub-heading">${CAMP_DETAILS.venueLabel}</div>
      <div class="venue-title">${CAMP_DETAILS.venueName}</div>
      <div class="venue-address">${CAMP_DETAILS.venueAddress}</div>
    </div>

    <!-- Student Details & Photograph -->
    <div class="student-section-wrapper">
      <div class="student-fields">
        <!-- Row 1: Name, Village, Age -->
        <div class="field-row">
          <span class="field-label">Name:</span>
          <div class="field-line" style="flex: 2.2;">${entry.name || ''}</div>
          <span class="field-label" style="margin-left: 12px;">Village:</span>
          <div class="field-line" style="flex: 1.2;">${entry.village || ''}</div>
          <span class="field-label" style="margin-left: 12px;">Age:</span>
          <div class="field-line" style="flex: 0.7;">${entry.age ? entry.age + ' yrs' : ''}</div>
        </div>

        <!-- Row 2: Weight, Height -->
        <div class="field-row">
          <span class="field-label">Weight:</span>
          <div class="field-line" style="flex: 1.5;">${entry.weight || ''}</div>
          <span class="field-label" style="margin-left: 20px;">Height:</span>
          <div class="field-line" style="flex: 1.5;">${entry.height || ''}</div>
        </div>

        <!-- Row 3: Class, Roll No. -->
        <div class="field-row">
          <span class="field-label">Class:</span>
          <div class="field-line" style="flex: 1.5;">${entry.classRoom || ''}</div>
          <span class="field-label" style="margin-left: 20px;">Roll No.:</span>
          <div class="field-line" style="flex: 1.5;">${entry.rollNo || ''}</div>
        </div>

        <!-- Row 4: C/o. -->
        <div class="field-row">
          <span class="field-label">C/o.</span>
          <div class="field-line" style="flex: 1;">${entry.careOf || ''}</div>
        </div>
      </div>

      <!-- Student Photograph Box -->
      <div class="photo-box-container">
        ${photoHtml}
      </div>
    </div>

    <!-- Clinical Examination / Heart Checkup -->
    <div class="medical-section">
      <div class="medical-block">
        <div class="medical-label">ECG:</div>
        <div class="medical-value">${entry.ecg || 'Not performed / Normal'}</div>
      </div>

      <div class="medical-block">
        <div class="medical-label">2D Echo Heart:</div>
        <div class="medical-value">${entry.echoHeart || 'Not performed / Normal'}</div>
      </div>

      <div class="advice-block">
        <div class="medical-label">Advice:</div>
        <div class="advice-value">${entry.advice || 'Routine follow-up.'}</div>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures-row">
      <div class="signature-col">
        <div class="signature-line"></div>
        <div class="signature-title">Medical Officer / Cardiologist</div>
      </div>
      <div class="signature-col">
        <div class="signature-line"></div>
        <div class="signature-title">Camp Coordinator / Authorized Signatory</div>
      </div>
    </div>

    <!-- Subtle Footer -->
    <div class="meta-footer">
      <span>Form Ref: ${entry.id} | Generated: ${new Date(entry.createdAt || Date.now()).toLocaleDateString()}</span>
      <span>ServeYeah Health • ${CAMP_DETAILS.website}</span>
    </div>
  </div>
</body>
</html>
  `;
}

export async function printScreeningForm(entry: StudentScreeningEntry): Promise<void> {
  const html = generateHealthFormHtml(entry);
  await Print.printAsync({ html });
}

export async function exportScreeningPdf(entry: StudentScreeningEntry): Promise<string> {
  const html = generateHealthFormHtml(entry);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Share Health Form - ${entry.name}`,
    });
  }
  return uri;
}
