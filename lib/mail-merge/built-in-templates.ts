/**
 * Seeded once into the EmailTemplate table (userId: null, isBuiltIn: true)
 * by prisma/seed.ts. The UI treats isBuiltIn rows as read-only — "Save as
 * custom template" duplicates one into a real, editable user-owned row.
 */
export const BUILT_IN_TEMPLATES = [
  {
    name: "Promotion Letter",
    subject: "Promotion Letter - {{Employee Name}}",
    body: `<p>Dear {{Employee Name}},</p><p>Congratulations!</p><p>We are pleased to inform you that you have been promoted to the position of {{Designation}} in the {{Department}} department.</p><p>Your promotion letter is attached to this email.</p><p>If your PDF is password-protected, use the following password to open it: {{PDF Password}}</p><p>Congratulations once again!</p><p>Regards,<br>HR Department</p>`,
  },
  {
    name: "Salary Increment Letter",
    subject: "Salary Revision Notice - {{Employee Name}}",
    body: `<p>Dear {{Employee Name}},</p><p>We are pleased to inform you of a revision to your salary, effective {{Current Date}}.</p><p>Please find the detailed letter attached.</p><p>Regards,<br>HR Department, {{Company Name}}</p>`,
  },
  {
    name: "Offer Letter",
    subject: "Offer of Employment - {{Employee Name}}",
    body: `<p>Dear {{Employee Name}},</p><p>We are delighted to offer you the position of {{Designation}} in the {{Department}} department at {{Company Name}}.</p><p>Please find your offer letter attached.</p><p>Regards,<br>HR Department</p>`,
  },
  {
    name: "Appointment Letter",
    subject: "Appointment Letter - {{Employee Name}}",
    body: `<p>Dear {{Employee Name}},</p><p>Welcome to {{Company Name}}. This confirms your appointment as {{Designation}} in the {{Department}} department, effective {{Current Date}}.</p><p>Please find your appointment letter attached.</p><p>Regards,<br>HR Department</p>`,
  },
  {
    name: "Relieving Letter",
    subject: "Relieving Letter - {{Employee Name}}",
    body: `<p>Dear {{Employee Name}},</p><p>This is to confirm that you have been relieved from your duties as {{Designation}} at {{Company Name}}, effective {{Current Date}}.</p><p>Please find your relieving letter attached.</p><p>Regards,<br>HR Department</p>`,
  },
  {
    name: "Experience Letter",
    subject: "Experience Letter - {{Employee Name}}",
    body: `<p>Dear {{Employee Name}},</p><p>This is to certify that you were employed with {{Company Name}} as {{Designation}} in the {{Department}} department.</p><p>Please find your experience letter attached.</p><p>Regards,<br>HR Department</p>`,
  },
  {
    name: "Payslip Distribution",
    subject: "Payslip - {{Employee Name}}",
    body: `<p>Dear {{Employee Name}},</p><p>Please find your payslip attached.</p><p>If the file is password-protected, use: {{PDF Password}}</p><p>Regards,<br>HR Department</p>`,
  },
  {
    name: "Bonus Letter",
    subject: "Bonus Announcement - {{Employee Name}}",
    body: `<p>Dear {{Employee Name}},</p><p>We are pleased to inform you of a bonus awarded in recognition of your contribution to {{Department}}.</p><p>Details are attached.</p><p>Regards,<br>HR Department</p>`,
  },
  {
    name: "Warning Letter",
    subject: "Formal Warning - {{Employee Name}}",
    body: `<p>Dear {{Employee Name}},</p><p>This letter serves as a formal warning regarding a matter discussed with you on {{Current Date}}. Please find the details attached.</p><p>Regards,<br>HR Department</p>`,
  },
  {
    name: "General Communication",
    subject: "Notice from {{Company Name}}",
    body: `<p>Dear {{Employee Name}},</p><p>[Write your message here.]</p><p>Regards,<br>{{Company Name}}</p>`,
  },
];
