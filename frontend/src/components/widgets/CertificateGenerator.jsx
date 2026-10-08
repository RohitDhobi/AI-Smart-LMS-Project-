import React, { useRef } from 'react';

export function CertificateGenerator({ 
  studentName = 'Student', 
  courseName = 'Course',
  completionDate = new Date().toLocaleDateString(),
  instructorName = 'Instructor',
  onDownload 
}) {
  const canvasRef = useRef(null);

  function generateCertificate() {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 850);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 850);

    // Border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 790);

    // Inner border
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 1100, 750);

    // Decorative corners
    const cornerSize = 40;
    ctx.fillStyle = '#3b82f6';
    // Top-left
    ctx.fillRect(30, 30, cornerSize, 4);
    ctx.fillRect(30, 30, 4, cornerSize);
    // Top-right
    ctx.fillRect(1130, 30, cornerSize, 4);
    ctx.fillRect(1166, 30, 4, cornerSize);
    // Bottom-left
    ctx.fillRect(30, 786, cornerSize, 4);
    ctx.fillRect(30, 750, 4, cornerSize);
    // Bottom-right
    ctx.fillRect(1130, 786, cornerSize, 4);
    ctx.fillRect(1166, 750, 4, cornerSize);

    // Trophy emoji
    ctx.font = '80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', 600, 140);

    // Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF COMPLETION', 600, 220);

    // Decorative line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 250);
    ctx.lineTo(1000, 250);
    ctx.stroke();

    // "This is to certify that"
    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px Arial';
    ctx.fillText('This is to certify that', 600, 310);

    // Student name
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 42px Arial';
    ctx.fillText(studentName, 600, 380);

    // Underline
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(350, 395);
    ctx.lineTo(850, 395);
    ctx.stroke();

    // "has successfully completed"
    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px Arial';
    ctx.fillText('has successfully completed the course', 600, 440);

    // Course name
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(courseName, 600, 500);

    // Date
    ctx.fillStyle = '#64748b';
    ctx.font = '20px Arial';
    ctx.fillText(`Completed on: ${completionDate}`, 600, 560);

    // Bottom section
    ctx.fillStyle = '#334155';
    ctx.fillRect(100, 620, 400, 1);
    ctx.fillRect(700, 620, 400, 1);

    // Instructor signature
    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px Arial';
    ctx.fillText('Instructor', 300, 660);
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'italic 22px Arial';
    ctx.fillText(instructorName, 300, 690);

    // Certificate ID
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Arial';
    ctx.fillText('Certificate ID: ' + generateCertId(), 900, 660);

    // QR Code placeholder
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(850, 680, 80, 80);
    ctx.strokeStyle = '#3b82f6';
    ctx.strokeRect(850, 680, 80, 80);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.fillText('Verify', 890, 725);

    // Footer
    ctx.fillStyle = '#475569';
    ctx.font = '14px Arial';
    ctx.fillText('AI Smart LMS • Verified Certificate', 600, 810);

    return canvas;
  }

  function generateCertId() {
    return 'CERT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }

  function handleDownload() {
    const canvas = generateCertificate();
    const link = document.createElement('a');
    link.download = `certificate-${courseName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (onDownload) onDownload();
  }

  function handlePreview() {
    const canvas = generateCertificate();
    const win = window.open('', '_blank');
    win.document.write(`<img src="${canvas.toDataURL('image/png')}" style="width:100%;max-width:1200px;" />`);
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 24,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
      }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
        }}>
          🏆
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Course Certificate</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Download your completion certificate
          </p>
        </div>
      </div>

      <div style={{
        background: '#0f172a',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
        <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: 14 }}>{courseName}</div>
        <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{studentName}</div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleDownload}
          style={{
            flex: 1,
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          📥 Download PNG
        </button>
        <button
          onClick={handlePreview}
          style={{
            padding: '12px 20px',
            background: 'var(--bg)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          👁️ Preview
        </button>
      </div>
    </div>
  );
}
