"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Upload, X, FileImage, FileText, Loader2, AlertCircle, Plus, CheckCircle2, Circle, Sparkles, RefreshCw, XCircle } from "lucide-react";
import { z } from "zod";
import * as pdfjsLib from "pdfjs-dist";

interface UploadZoneProps {
  childId: string;
  retryUploadId?: string;
}

const uploadTexts: Record<string, {
  uploadTitle: string;
  uploadDesc: string;
  maxFileSize: string;
  addMore: string;
  pdfConverting: string;
  aiRunning: string;
  stepUpload: string;
  stepExtract: string;
  stepReport: string;
  stepDone: string;
  btnUploading: string;
  btnExtracting: string;
  btnAnalyzing: string;
  btnDone: string;
  analyzePage: string;
  analyzePages: string;
  error: string;
  removeFile: string;
  preview: string;
  fileTooLarge: string;
  onlyFormats: string;
  totalSizeExceeded: string;
  pdfFailed: string;
  uploadFailed: string;
  serverError: string;
  vercelLimit: string;
  noImages: string;
  extractFailed: string;
  reportFailed: string;
  retryBtn: string;
  startOverBtn: string;
  retryTipUpload: string;
  retryTipExtract: string;
  retryTipReport: string;
}> = {
  de: {
    uploadTitle: 'Testseiten hochladen',
    uploadDesc: 'Laden Sie alle Seiten eines Tests zusammen hoch \u2013 per Drag & Drop oder Klick',
    maxFileSize: 'Max. 4,5 MB pro Datei',
    addMore: 'Weitere Seiten hinzuf\u00fcgen',
    pdfConverting: 'PDF wird konvertiert...',
    aiRunning: 'KI-Analyse l\u00e4uft',
    stepUpload: 'Dateien hochladen',
    stepExtract: 'Text extrahieren (KI-Vision)',
    stepReport: 'Bericht erstellen (KI-Analyse)',
    stepDone: 'Fertig!',
    btnUploading: 'Hochladen...',
    btnExtracting: 'Text wird extrahiert...',
    btnAnalyzing: 'Bericht wird erstellt...',
    btnDone: 'Fertig!',
    analyzePage: '1 Seite analysieren',
    analyzePages: 'Seiten analysieren',
    error: 'Fehler',
    removeFile: 'Datei entfernen',
    preview: 'Vorschau',
    fileTooLarge: 'Datei muss kleiner als 4,5 MB sein',
    onlyFormats: 'Nur JPG, PNG und PDF Dateien sind erlaubt',
    totalSizeExceeded: '\u00fcberschreitet das 50-MB-Limit. Bitte reduzieren Sie die Bildqualit\u00e4t oder Seitenzahl.',
    pdfFailed: 'PDF-Konvertierung fehlgeschlagen',
    uploadFailed: 'Upload fehlgeschlagen',
    serverError: 'Serverfehler. Bitte versuchen Sie es sp\u00e4ter erneut.',
    vercelLimit: 'Dateien sind zu gro\u00df. Vercel Free Tier erlaubt max. 4 MB.',
    noImages: 'Keine Bilder vom Upload erhalten',
    extractFailed: 'Textextraktion fehlgeschlagen',
    reportFailed: 'Berichterstellung fehlgeschlagen',
    retryBtn: 'Wiederholen',
    startOverBtn: 'Neu starten',
    retryTipUpload: 'Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    retryTipExtract: 'Ihre Dateien wurden erfolgreich hochgeladen. Klicken Sie auf Wiederholen, um die Analyse neu zu starten — kein erneuter Upload nötig.',
    retryTipReport: 'Text wurde erfolgreich extrahiert. Klicken Sie auf Wiederholen, um den Bericht neu zu erstellen.',
  },
  en: {
    uploadTitle: 'Upload test pages',
    uploadDesc: 'Upload all pages of a test together \u2013 via drag & drop or click',
    maxFileSize: 'Max. 4.5 MB per file',
    addMore: 'Add more pages',
    pdfConverting: 'Converting PDF...',
    aiRunning: 'AI analysis running',
    stepUpload: 'Uploading files',
    stepExtract: 'Extracting text (AI Vision)',
    stepReport: 'Generating report (AI Analysis)',
    stepDone: 'Done!',
    btnUploading: 'Uploading...',
    btnExtracting: 'Extracting text...',
    btnAnalyzing: 'Generating report...',
    btnDone: 'Done!',
    analyzePage: 'Analyze 1 page',
    analyzePages: 'pages to analyze',
    error: 'Error',
    removeFile: 'Remove file',
    preview: 'Preview',
    fileTooLarge: 'File must be smaller than 4.5 MB',
    onlyFormats: 'Only JPG, PNG and PDF files are allowed',
    totalSizeExceeded: 'exceeds the 50 MB limit. Please reduce image quality or page count.',
    pdfFailed: 'PDF conversion failed',
    uploadFailed: 'Upload failed',
    serverError: 'Server error. Please try again later.',
    vercelLimit: 'Files are too large. Vercel Free Tier allows max. 4 MB.',
    noImages: 'No images received from upload',
    extractFailed: 'Text extraction failed',
    reportFailed: 'Report generation failed',
    retryBtn: 'Retry',
    startOverBtn: 'Start Over',
    retryTipUpload: 'Please check your connection and try again.',
    retryTipExtract: 'Your files were uploaded successfully. Click Retry to re-run the analysis — no re-upload needed.',
    retryTipReport: 'Text was extracted successfully. Click Retry to regenerate the report.',
  },
  ar: {
    uploadTitle: '\u062a\u062d\u0645\u064a\u0644 \u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631',
    uploadDesc: '\u062d\u0645\u0651\u0644 \u062c\u0645\u064a\u0639 \u0635\u0641\u062d\u0627\u062a \u0627\u0644\u0627\u062e\u062a\u0628\u0627\u0631 \u0645\u0639\u064b\u0627 \u2013 \u0639\u0628\u0631 \u0627\u0644\u0633\u062d\u0628 \u0648\u0627\u0644\u0625\u0641\u0644\u0627\u062a \u0623\u0648 \u0627\u0644\u0646\u0642\u0631',
    maxFileSize: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 4.5 \u0645\u064a\u063a\u0627\u0628\u0627\u064a\u062a \u0644\u0643\u0644 \u0645\u0644\u0641',
    addMore: '\u0625\u0636\u0627\u0641\u0629 \u0635\u0641\u062d\u0627\u062a \u0623\u062e\u0631\u0649',
    pdfConverting: '\u062c\u0627\u0631\u064a \u062a\u062d\u0648\u064a\u0644 PDF...',
    aiRunning: '\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0642\u064a\u062f \u0627\u0644\u062a\u0634\u063a\u064a\u0644',
    stepUpload: '\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0644\u0641\u0627\u062a',
    stepExtract: '\u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0627\u0644\u0646\u0635 (\u0631\u0624\u064a\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a)',
    stepReport: '\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 (\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a)',
    stepDone: '\u062a\u0645!',
    btnUploading: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
    btnExtracting: '\u062c\u0627\u0631\u064a \u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0627\u0644\u0646\u0635...',
    btnAnalyzing: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0642\u0631\u064a\u0631...',
    btnDone: '\u062a\u0645!',
    analyzePage: '\u062a\u062d\u0644\u064a\u0644 \u0635\u0641\u062d\u0629 \u0648\u0627\u062d\u062f\u0629',
    analyzePages: '\u0635\u0641\u062d\u0627\u062a \u0644\u0644\u062a\u062d\u0644\u064a\u0644',
    error: '\u062e\u0637\u0623',
    removeFile: '\u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u0645\u0644\u0641',
    preview: '\u0645\u0639\u0627\u064a\u0646\u0629',
    fileTooLarge: '\u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0627\u0644\u0645\u0644\u0641 \u0623\u0635\u063a\u0631 \u0645\u0646 4.5 \u0645\u064a\u063a\u0627\u0628\u0627\u064a\u062a',
    onlyFormats: '\u064a\u064f\u0633\u0645\u062d \u0641\u0642\u0637 \u0628\u0645\u0644\u0641\u0627\u062a JPG \u0648PNG \u0648PDF',
    totalSizeExceeded: '\u064a\u062a\u062c\u0627\u0648\u0632 \u062d\u062f 50 \u0645\u064a\u063a\u0627\u0628\u0627\u064a\u062a. \u064a\u0631\u062c\u0649 \u062a\u0642\u0644\u064a\u0644 \u062c\u0648\u062f\u0629 \u0627\u0644\u0635\u0648\u0631\u0629 \u0623\u0648 \u0639\u062f\u062f \u0627\u0644\u0635\u0641\u062d\u0627\u062a.',
    pdfFailed: 'PDF-\u0643\u0648\u0646\u0641\u0631\u062a\u064a\u0631\u0648\u0646 \u0641\u0634\u0644\u062a',
    uploadFailed: '\u0641\u0634\u0644 \u0627\u0644\u062a\u062d\u0645\u064a\u0644',
    serverError: '\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u062e\u0627\u062f\u0645. \u064a\u0631\u062c\u0649 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0644\u0627\u062d\u0642\u064b\u0627.',
    vercelLimit: '\u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0643\u0628\u064a\u0631\u0629 \u062c\u062f\u064b\u0627. Vercel Free Tier \u064a\u0633\u0645\u062d \u0628\u062d\u062f \u0623\u0642\u0635\u0649 4 \u0645\u064a\u063a\u0627\u0628\u0627\u064a\u062a.',
    noImages: '\u0644\u0645 \u064a\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0635\u0648\u0631 \u0645\u0646 \u0627\u0644\u062a\u062d\u0645\u064a\u0644',
    extractFailed: '\u0641\u0634\u0644 \u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0627\u0644\u0646\u0635',
    reportFailed: '\u0641\u0634\u0644 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0642\u0631\u064a\u0631',
    retryBtn: '\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629',
    startOverBtn: '\u0627\u0644\u0628\u062f\u0621 \u0645\u0646 \u062c\u062f\u064a\u062f',
    retryTipUpload: '\u064a\u0631\u062c\u0649 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u062a\u0635\u0627\u0644\u0643 \u0648\u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.',
    retryTipExtract: '\u062a\u0645 \u062a\u062d\u0645\u064a\u0644 \u0645\u0644\u0641\u0627\u062a\u0643 \u0628\u0646\u062c\u0627\u062d. \u0627\u0646\u0642\u0631 \u0641\u0648\u0642 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0644\u0625\u0639\u0627\u062f\u0629 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u2014 \u0644\u0627 \u062d\u0627\u062c\u0629 \u0644\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u062d\u0645\u064a\u0644.',
    retryTipReport: '\u062a\u0645 \u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0627\u0644\u0646\u0635 \u0628\u0646\u062c\u0627\u062d. \u0627\u0646\u0642\u0631 \u0641\u0648\u0642 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0644\u0625\u0639\u0627\u062f\u0629 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0642\u0631\u064a\u0631.',
  },
  tr: {
    uploadTitle: 'Test sayfalar\u0131n\u0131 y\u00fckle',
    uploadDesc: 'T\u00fcm test sayfalar\u0131n\u0131 birlikte y\u00fckleyin \u2013 s\u00fcr\u00fckle b\u0131rak veya t\u0131klay\u0131n',
    maxFileSize: 'Dosya ba\u015f\u0131na maks. 4,5 MB',
    addMore: 'Daha fazla sayfa ekle',
    pdfConverting: 'PDF d\u00f6n\u00fc\u015ft\u00fcr\u00fcl\u00fcyor...',
    aiRunning: 'Yapay zeka analizi \u00e7al\u0131\u015f\u0131yor',
    stepUpload: 'Dosyalar y\u00fckleniyor',
    stepExtract: 'Metin \u00e7\u0131kar\u0131l\u0131yor (Yapay Zeka)',
    stepReport: 'Rapor olu\u015fturuluyor (Yapay Zeka)',
    stepDone: 'Tamamland\u0131!',
    btnUploading: 'Y\u00fckleniyor...',
    btnExtracting: 'Metin \u00e7\u0131kar\u0131l\u0131yor...',
    btnAnalyzing: 'Rapor olu\u015fturuluyor...',
    btnDone: 'Tamamland\u0131!',
    analyzePage: '1 sayfay\u0131 analiz et',
    analyzePages: 'sayfay\u0131 analiz et',
    error: 'Hata',
    removeFile: 'Dosyay\u0131 kald\u0131r',
    preview: '\u00d6nizleme',
    fileTooLarge: 'Dosya 4,5 MB\'dan k\u00fc\u00e7\u00fck olmal\u0131d\u0131r',
    onlyFormats: 'Sadece JPG, PNG ve PDF dosyalar\u0131na izin verilir',
    totalSizeExceeded: '50 MB limitini a\u015f\u0131yor. L\u00fctfen g\u00f6r\u00fcnt\u00fc kalitesini veya sayfa say\u0131s\u0131n\u0131 azalt\u0131n.',
    pdfFailed: 'PDF d\u00f6n\u00fc\u015ft\u00fcrme ba\u015far\u0131s\u0131z',
    uploadFailed: 'Y\u00fckleme ba\u015far\u0131s\u0131z',
    serverError: 'Sunucu hatas\u0131. L\u00fctfen daha sonra tekrar deneyin.',
    vercelLimit: 'Dosyalar \u00e7ok b\u00fcy\u00fck. Vercel Free Tier maks. 4 MB\'a izin verir.',
    noImages: 'Y\u00fcklemeden g\u00f6r\u00fcnt\u00fc al\u0131namad\u0131',
    extractFailed: 'Metin \u00e7\u0131karma ba\u015far\u0131s\u0131z',
    reportFailed: 'Rapor olu\u015fturma ba\u015far\u0131s\u0131z',
    retryBtn: 'Tekrar Dene',
    startOverBtn: 'Ba\u015ftan Ba\u015fla',
    retryTipUpload: 'L\u00fctfen ba\u011flant\u0131n\u0131z\u0131 kontrol edin ve tekrar deneyin.',
    retryTipExtract: "Dosyalar\u0131n\u0131z ba\u015far\u0131yla y\u00fcklendi. Analizi yeniden \u00e7al\u0131\u015ft\u0131rmak i\u00e7in Tekrar Dene'ye t\u0131klay\u0131n \u2014 yeniden y\u00fcklemeye gerek yok.",
    retryTipReport: "Metin ba\u015far\u0131yla \u00e7\u0131kar\u0131ld\u0131. Raporu yeniden olu\u015fturmak i\u00e7in Tekrar Dene'ye t\u0131klay\u0131n.",
  },
  ro: {
    uploadTitle: '\u00cenc\u0103rca\u021bi paginile testului',
    uploadDesc: '\u00cenc\u0103rca\u021bi toate paginile unui test \u00eempreun\u0103 \u2013 prin drag & drop sau click',
    maxFileSize: 'Max. 4,5 MB per fi\u015fier',
    addMore: 'Ad\u0103uga\u021bi mai multe pagini',
    pdfConverting: 'Se converte\u015fte PDF-ul...',
    aiRunning: 'Analiza AI \u00een curs',
    stepUpload: '\u00cenc\u0103rcarea fi\u015fierelor',
    stepExtract: 'Extragerea textului (AI Vision)',
    stepReport: 'Generarea raportului (Analiz\u0103 AI)',
    stepDone: 'Gata!',
    btnUploading: 'Se \u00eenc\u0103rc\u0103...',
    btnExtracting: 'Se extrage textul...',
    btnAnalyzing: 'Se genereaz\u0103 raportul...',
    btnDone: 'Gata!',
    analyzePage: 'Analizeaz\u0103 1 pagin\u0103',
    analyzePages: 'pagini de analizat',
    error: 'Eroare',
    removeFile: '\u0218terge fi\u015fierul',
    preview: 'Previzualizare',
    fileTooLarge: 'Fi\u015fierul trebuie s\u0103 fie mai mic de 4,5 MB',
    onlyFormats: 'Sunt permise doar fi\u015fiere JPG, PNG \u015fi PDF',
    totalSizeExceeded: 'dep\u0103\u015fe\u015fte limita de 50 MB. V\u0103 rug\u0103m reduce\u021bi calitatea imaginii sau num\u0103rul de pagini.',
    pdfFailed: 'Conversia PDF a e\u015fuat',
    uploadFailed: '\u00cenc\u0103rcarea a e\u015fuat',
    serverError: 'Eroare de server. V\u0103 rug\u0103m \u00eencerca\u021bi din nou mai t\u00e2rziu.',
    vercelLimit: 'Fi\u015fierele sunt prea mari. Vercel Free Tier permite max. 4 MB.',
    noImages: 'Nu s-au primit imagini de la \u00eenc\u0103rcare',
    extractFailed: 'Extragerea textului a e\u0219uat',
    reportFailed: 'Generarea raportului a e\u0219uat',
    retryBtn: '\u00cencearc\u0103 din nou',
    startOverBtn: 'Re\u00eencepe',
    retryTipUpload: 'V\u0103 rug\u0103m s\u0103 v\u0103 verifica\u021bi conexiunea \u0219i s\u0103 \u00eencerca\u021bi din nou.',
    retryTipExtract: 'Fi\u0219ierele dvs. au fost \u00eenc\u0103rcate cu succes. Face\u021bi clic pe \u00cencearc\u0103 din nou pentru a rula analiza din nou \u2014 nu este nevoie de o nou\u0103 \u00eenc\u0103rcare.',
    retryTipReport: 'Textul a fost extras cu succes. Face\u021bi clic pe \u00cencearc\u0103 din nou pentru a regenera raportul.',
  },
  ru: {
    uploadTitle: '\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b \u0442\u0435\u0441\u0442\u0430',
    uploadDesc: '\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0432\u0441\u0435 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b \u0442\u0435\u0441\u0442\u0430 \u0432\u043c\u0435\u0441\u0442\u0435 \u2013 \u043f\u0435\u0440\u0435\u0442\u0430\u0441\u043a\u0438\u0432\u0430\u043d\u0438\u0435\u043c \u0438\u043b\u0438 \u043a\u043b\u0438\u043a\u043e\u043c',
    maxFileSize: '\u041c\u0430\u043a\u0441. 4,5 \u041c\u0411 \u043d\u0430 \u0444\u0430\u0439\u043b',
    addMore: '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0435\u0449\u0451 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u044b',
    pdfConverting: '\u041a\u043e\u043d\u0432\u0435\u0440\u0442\u0430\u0446\u0438\u044f PDF...',
    aiRunning: '\u0410\u043d\u0430\u043b\u0438\u0437 \u0418\u0418 \u0432\u044b\u043f\u043e\u043b\u043d\u044f\u0435\u0442\u0441\u044f',
    stepUpload: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0444\u0430\u0439\u043b\u043e\u0432',
    stepExtract: '\u0418\u0437\u0432\u043b\u0435\u0447\u0435\u043d\u0438\u0435 \u0442\u0435\u043a\u0441\u0442\u0430 (\u0418\u0418)',
    stepReport: '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u043e\u0442\u0447\u0451\u0442\u0430 (\u0418\u0418)',
    stepDone: '\u0413\u043e\u0442\u043e\u0432\u043e!',
    btnUploading: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...',
    btnExtracting: '\u0418\u0437\u0432\u043b\u0435\u0447\u0435\u043d\u0438\u0435 \u0442\u0435\u043a\u0441\u0442\u0430...',
    btnAnalyzing: '\u0421\u043e\u0437\u0434\u0430\u043d\u0438\u0435 \u043e\u0442\u0447\u0451\u0442\u0430...',
    btnDone: '\u0413\u043e\u0442\u043e\u0432\u043e!',
    analyzePage: '\u0410\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u0442\u044c 1 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443',
    analyzePages: '\u0441\u0442\u0440\u0430\u043d\u0438\u0446 \u0434\u043b\u044f \u0430\u043d\u0430\u043b\u0438\u0437\u0430',
    error: '\u041e\u0448\u0438\u0431\u043a\u0430',
    removeFile: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0444\u0430\u0439\u043b',
    preview: '\u041f\u0440\u0435\u0434\u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440',
    fileTooLarge: '\u0424\u0430\u0439\u043b \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043c\u0435\u043d\u044c\u0448\u0435 4,5 \u041c\u0411',
    onlyFormats: '\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u044b \u0442\u043e\u043b\u044c\u043a\u043e \u0444\u0430\u0439\u043b\u044b JPG, PNG \u0438 PDF',
    totalSizeExceeded: '\u043f\u0440\u0435\u0432\u044b\u0448\u0430\u0435\u0442 \u043b\u0438\u043c\u0438\u0442 50 \u041c\u0411. \u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0443\u043c\u0435\u043d\u044c\u0448\u0438\u0442\u0435 \u043a\u0430\u0447\u0435\u0441\u0442\u0432\u043e \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u0439 \u0438\u043b\u0438 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0441\u0442\u0440\u0430\u043d\u0438\u0446.',
    pdfFailed: '\u041e\u0448\u0438\u0431\u043a\u0430 \u043a\u043e\u043d\u0432\u0435\u0440\u0442\u0430\u0446\u0438\u0438 PDF',
    uploadFailed: '\u041e\u0448\u0438\u0431\u043a\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438',
    serverError: '\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430. \u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043f\u043e\u0437\u0436\u0435.',
    vercelLimit: '\u0424\u0430\u0439\u043b\u044b \u0441\u043b\u0438\u0448\u043a\u043e\u043c \u0431\u043e\u043b\u044c\u0448\u0438\u0435. Vercel Free Tier \u043f\u043e\u0437\u0432\u043e\u043b\u044f\u0435\u0442 \u043c\u0430\u043a\u0441. 4 \u041c\u0411.',
    noImages: '\u0418\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f \u043d\u0435 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u044b',
    extractFailed: '\u041e\u0448\u0438\u0431\u043a\u0430 \u0438\u0437\u0432\u043b\u0435\u0447\u0435\u043d\u0438\u044f \u0442\u0435\u043a\u0441\u0442\u0430',
    reportFailed: '\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0437\u0434\u0430\u043d\u0438\u044f \u043e\u0442\u0447\u0451\u0442\u0430',
    retryBtn: '\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c',
    startOverBtn: '\u041d\u0430\u0447\u0430\u0442\u044c \u0441\u043d\u0430\u0447\u0430\u043b\u0430',
    retryTipUpload: '\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u043f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435 \u0438 \u043f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0435 \u043f\u043e\u043f\u044b\u0442\u043a\u0443.',
    retryTipExtract: '\u0412\u0430\u0448\u0438 \u0444\u0430\u0439\u043b\u044b \u0443\u0441\u043f\u0435\u0448\u043d\u043e \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u044b. \u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c, \u0447\u0442\u043e\u0431\u044b \u043f\u0435\u0440\u0435\u0437\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c \u0430\u043d\u0430\u043b\u0438\u0437 \u2014 \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u0430\u044f \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043d\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f.',
    retryTipReport: '\u0422\u0435\u043a\u0441\u0442 \u0443\u0441\u043f\u0435\u0448\u043d\u043e \u0438\u0437\u0432\u043b\u0435\u0447\u0435\u043d. \u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c, \u0447\u0442\u043e\u0431\u044b \u043f\u0435\u0440\u0435\u0441\u043e\u0437\u0434\u0430\u0442\u044c \u043e\u0442\u0447\u0435\u0442.',
  },
  fa: {
    uploadTitle: '\u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0635\u0641\u062d\u0627\u062a \u0622\u0632\u0645\u0648\u0646',
    uploadDesc: '\u0647\u0645\u0647 \u0635\u0641\u062d\u0627\u062a \u0622\u0632\u0645\u0648\u0646 \u0631\u0627 \u0628\u0627 \u0647\u0645 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u06a9\u0646\u06cc\u062f \u2013 \u06a9\u0634\u06cc\u062f\u0646 \u0648 \u0631\u0647\u0627 \u06a9\u0631\u062f\u0646 \u06cc\u0627 \u06a9\u0644\u06cc\u06a9',
    maxFileSize: '\u062d\u062f\u0627\u06a9\u062b\u0631 4.5 \u0645\u06af\u0627\u0628\u0627\u06cc\u062a \u0628\u0631\u0627\u06cc \u0647\u0631 \u0641\u0627\u06cc\u0644',
    addMore: '\u0627\u0636\u0627\u0641\u0647 \u06a9\u0631\u062f\u0646 \u0635\u0641\u062d\u0627\u062a \u0628\u06cc\u0634\u062a\u0631',
    pdfConverting: '\u062f\u0631 \u062d\u0627\u0644 \u062a\u0628\u062f\u06cc\u0644 PDF...',
    aiRunning: '\u062a\u062d\u0644\u06cc\u0644 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06cc \u062f\u0631 \u062d\u0627\u0644 \u0627\u062c\u0631\u0627',
    stepUpload: '\u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0641\u0627\u06cc\u0644\u200c\u0647\u0627',
    stepExtract: '\u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0645\u062a\u0646 (\u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06cc)',
    stepReport: '\u0627\u06cc\u062c\u0627\u062f \u06af\u0632\u0627\u0631\u0634 (\u062a\u062d\u0644\u06cc\u0644 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06cc)',
    stepDone: '\u0627\u0646\u062c\u0627\u0645 \u0634\u062f!',
    btnUploading: '\u062f\u0631 \u062d\u0627\u0644 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc...',
    btnExtracting: '\u062f\u0631 \u062d\u0627\u0644 \u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0645\u062a\u0646...',
    btnAnalyzing: '\u062f\u0631 \u062d\u0627\u0644 \u0627\u06cc\u062c\u0627\u062f \u06af\u0632\u0627\u0631\u0634...',
    btnDone: '\u0627\u0646\u062c\u0627\u0645 \u0634\u062f!',
    analyzePage: '\u062a\u062d\u0644\u06cc\u0644 1 \u0635\u0641\u062d\u0647',
    analyzePages: '\u0635\u0641\u062d\u0647 \u0628\u0631\u0627\u06cc \u062a\u062d\u0644\u06cc\u0644',
    error: '\u062e\u0637\u0627',
    removeFile: '\u062d\u0630\u0641 \u0641\u0627\u06cc\u0644',
    preview: '\u067e\u06cc\u0634\u200c\u0646\u0645\u0627\u06cc\u0634',
    fileTooLarge: '\u0641\u0627\u06cc\u0644 \u0628\u0627\u06cc\u062f \u06a9\u0645\u062a\u0631 \u0627\u0632 4.5 \u0645\u06af\u0627\u0628\u0627\u06cc\u062a \u0628\u0627\u0634\u062f',
    onlyFormats: '\u0641\u0642\u0637 \u0641\u0627\u06cc\u0644\u200c\u0647\u0627\u06cc JPG\u060c PNG \u0648 PDF \u0645\u062c\u0627\u0632 \u0647\u0633\u062a\u0646\u062f',
    totalSizeExceeded: '\u0627\u0632 \u062d\u062f 50 \u0645\u06af\u0627\u0628\u0627\u06cc\u062a \u0641\u0631\u0627\u062a\u0631 \u0645\u06cc\u200c\u0631\u0648\u062f. \u0644\u0637\u0641\u0627\u064b \u06a9\u06cc\u0641\u06cc\u062a \u062a\u0635\u0648\u06cc\u0631 \u06cc\u0627 \u062a\u0639\u062f\u0627\u062f \u0635\u0641\u062d\u0627\u062a \u0631\u0627 \u06a9\u0627\u0647\u0634 \u062f\u0647\u06cc\u062f.',
    pdfFailed: '\u062e\u0637\u0627 \u062f\u0631 \u062a\u0628\u062f\u06cc\u0644 PDF',
    uploadFailed: '\u062e\u0637\u0627 \u062f\u0631 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc',
    serverError: '\u062e\u0637\u0627\u06cc \u0633\u0631\u0648\u0631. \u0644\u0637\u0641\u0627\u064b \u0628\u0639\u062f\u0627\u064b \u062f\u0648\u0628\u0627\u0631\u0647 \u0627\u0645\u062a\u062d\u0627\u0646 \u06a9\u0646\u06cc\u062f.',
    vercelLimit: '\u0641\u0627\u06cc\u0644\u200c\u0647\u0627 \u0628\u0633\u06cc\u0627\u0631 \u0628\u0632\u0631\u06af \u0647\u0633\u062a\u0646\u062f. Vercel Free Tier \u062d\u062f\u0627\u06a9\u062b\u0631 4 \u0645\u06af\u0627\u0628\u0627\u06cc\u062a.',
    noImages: '\u062a\u0635\u0648\u06cc\u0631\u06cc \u0627\u0632 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u062f\u0631\u06cc\u0627\u0641\u062a \u0646\u0634\u062f',
    extractFailed: '\u062e\u0637\u0627 \u062f\u0631 \u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0645\u062a\u0646',
    reportFailed: '\u062e\u0637\u0627 \u062f\u0631 \u0627\u06cc\u062c\u0627\u062f \u06af\u0632\u0627\u0631\u0634',
    retryBtn: '\u062a\u0644\u0627\u0634 \u0645\u062c\u062f\u062f',
    startOverBtn: '\u0634\u0631\u0648\u0639 \u0645\u062c\u062f\u062f',
    retryTipUpload: '\u0644\u0637\u0641\u0627\u064b \u0627\u062a\u0635\u0627\u0644 \u062e\u0648\u062f \u0631\u0627 \u0628\u0631\u0631\u0633\u06cc \u06a9\u0631\u062f\u0647 \u0648 \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.',
    retryTipExtract: '\u0641\u0627\u06cc\u0644\u200c\u0647\u0627\u06cc \u0634\u0645\u0627 \u0628\u0627 \u0645\u0648\u0641\u0642\u06cc\u062a \u0622\u067e\u0644\u0648\u062f \u0634\u062f\u0646\u062f. \u0628\u0631\u0627\u06cc \u0627\u062c\u0631\u0627\u06cc \u0645\u062c\u062f\u062f \u062a\u062c\u0632\u06cc\u0647 \u0648 \u062a\u062d\u0644\u06cc\u0644 \u0631\u0648\u06cc \u062a\u0644\u0627\u0634 \u0645\u062c\u062f\u062f \u06a9\u0644\u06cc\u06a9 \u06a9\u0646\u06cc\u062f - \u0646\u06cc\u0627\u0632\u06cc \u0628\u0647 \u0622\u067e\u0644\u0648\u062f \u0645\u062c\u062f\u062f \u0646\u06cc\u0633\u062a.',
    retryTipReport: '\u0645\u062a\u0646 \u0628\u0627 \u0645\u0648\u0641\u0642\u06cc\u062a \u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0634\u062f. \u0628\u0631\u0627\u06cc \u0628\u0627\u0632\u0633\u0627\u0632\u06cc \u06af\u0632\u0627\u0631\u0634 \u0631\u0648\u06cc \u062a\u0644\u0627\u0634 \u0645\u062c\u062f\u062f \u06a9\u0644\u06cc\u06a9 \u06a9\u0646\u06cc\u062f.',
  },
  ku: {
    uploadTitle: '\u0628\u0627\u0631\u06a9\u0631\u062f\u0646\u06cc \u067e\u06d5\u0695\u06d5\u06a9\u0627\u0646\u06cc \u062a\u0627\u0642\u06cc\u06a9\u0631\u062f\u0646\u06d5\u0648\u06d5',
    uploadDesc: '\u0647\u06d5\u0645\u0648\u0648 \u067e\u06d5\u0695\u06d5\u06a9\u0627\u0646\u06cc \u062a\u0627\u0642\u06cc\u06a9\u0631\u062f\u0646\u06d5\u0648\u06d5 \u067e\u06ce\u06a9\u06d5\u0648\u06d5 \u0628\u0627\u0631\u0628\u06a9\u06d5 \u2013 \u0695\u0627\u06a9\u06ce\u0634\u0627\u0646 \u06cc\u0627\u0646 \u06a9\u0644\u06cc\u06a9',
    maxFileSize: '\u0632\u06c6\u0631\u062a\u0631\u06cc\u0646 4.5 \u0645\u06ce\u06af\u0627\u0628\u0627\u06cc\u062a \u0628\u06c6 \u0647\u06d5\u0631 \u0641\u0627\u06cc\u0644',
    addMore: '\u0632\u06cc\u0627\u062f\u06a9\u0631\u062f\u0646\u06cc \u067e\u06d5\u0695\u06d5\u06cc \u0632\u06cc\u0627\u062a\u0631',
    pdfConverting: '\u06af\u06c6\u0695\u06cc\u0646\u06cc PDF...',
    aiRunning: '\u0634\u06cc\u06a9\u0627\u0631\u06cc \u0632\u06cc\u0631\u06d5\u06a9\u06cc \u062f\u06d5\u0633\u062a\u06a9\u0631\u062f \u06a9\u0627\u0631\u062f\u06d5\u06a9\u0627\u062a',
    stepUpload: '\u0628\u0627\u0631\u06a9\u0631\u062f\u0646\u06cc \u0641\u0627\u06cc\u0644\u06d5\u06a9\u0627\u0646',
    stepExtract: '\u062f\u06d5\u0631\u0647\u06ce\u0646\u0627\u0646\u06cc \u062f\u06d5\u0642 (\u0632\u06cc\u0631\u06d5\u06a9\u06cc \u062f\u06d5\u0633\u062a\u06a9\u0631\u062f)',
    stepReport: '\u062f\u0631\u0648\u0633\u062a\u06a9\u0631\u062f\u0646\u06cc \u0695\u0627\u067e\u06c6\u0631\u062a (\u0634\u06cc\u06a9\u0627\u0631\u06cc)',
    stepDone: '\u062a\u06d5\u0648\u0627\u0648 \u0628\u0648\u0648!',
    btnUploading: '\u0628\u0627\u0631\u062f\u06d5\u06a9\u0631\u06ce\u062a...',
    btnExtracting: '\u062f\u06d5\u0642 \u062d\u06d5\u0644\u062f\u06d5\u0643\u0631\u062f\u0646...',
    btnAnalyzing: '\u0695\u0627\u067e\u06c6\u0631\u062a \u062f\u0631\u0648\u0633\u062a\u062f\u06d5\u06a9\u0631\u06ce\u062a...',
    btnDone: '\u062a\u06d5\u0648\u0627\u0648 \u0628\u0648\u0648!',
    analyzePage: '\u0634\u06cc\u06a9\u0627\u0631\u06cc 1 \u067e\u06d5\u0695\u06d5',
    analyzePages: '\u067e\u06d5\u0695\u06d5 \u0628\u06c6 \u0634\u06cc\u06a9\u0627\u0631\u06cc',
    error: '\u0647\u06d5\u06b5\u06d5',
    removeFile: '\u0633\u0695\u06cc\u0646\u06d5\u0648\u06d5\u06cc \u0641\u0627\u06cc\u0644',
    preview: '\u067e\u06ce\u0634\u0628\u06cc\u0646\u06cc\u0646',
    fileTooLarge: '\u0641\u0627\u06cc\u0644 \u062f\u06d5\u0628\u06ce\u062a \u0644\u06d5 4.5 \u0645\u06ce\u06af\u0627\u0628\u0627\u06cc\u062a \u0628\u0686\u0648\u06a9\u062a\u0631 \u0628\u06ce\u062a',
    onlyFormats: '\u062a\u06d5\u0646\u0647\u0627 \u0641\u0627\u06cc\u0644\u06d5\u06a9\u0627\u0646\u06cc JPG\u060c PNG \u0648 PDF \u0695\u06ce\u06af\u06d5\u067e\u06ce\u062f\u0631\u0627\u0648\u0646',
    totalSizeExceeded: '\u0644\u06d5 \u0633\u0646\u0648\u0648\u0631\u06cc 50 \u0645\u06ce\u06af\u0627\u0628\u0627\u06cc\u062a \u062a\u06ce\u062f\u06d5\u067e\u06d5\u0695\u06ce\u062a. \u062a\u06a9\u0627\u06cc\u06d5 \u06a9\u0648\u0627\u0644\u06cc\u062a\u06cc \u0648\u06ce\u0646\u06d5 \u06cc\u0627\u0646 \u0698\u0645\u0627\u0631\u06d5\u06cc \u067e\u06d5\u0695\u06d5\u06a9\u0627\u0646 \u06a9\u06d5\u0645\u0628\u06a9\u06d5\u0646\u06d5\u0648\u06d5.',
    pdfFailed: '\u06af\u06c6\u0695\u06cc\u0646\u06cc PDF \u0634\u06a9\u0633\u062a\u06cc \u0647\u06ce\u0646\u0627',
    uploadFailed: '\u0628\u0627\u0631\u06a9\u0631\u062f\u0646 \u0634\u06a9\u0633\u062a\u06cc \u0647\u06ce\u0646\u0627',
    serverError: '\u0647\u06d5\u06b5\u06d5\u06cc \u0633\u06ce\u0631\u06a4\u06d5\u0631. \u062a\u06a9\u0627\u06cc\u06d5 \u062f\u0648\u0627\u062a\u0631 \u0647\u06d5\u0648\u06b5\u0628\u062f\u06d5\u0631\u06d5\u0648\u06d5.',
    vercelLimit: '\u0641\u0627\u06cc\u0644\u06d5\u06a9\u0627\u0646 \u0632\u06c6\u0631 \u06af\u06d5\u0648\u0631\u06d5\u0646. Vercel Free Tier \u0632\u06c6\u0631\u062a\u0631\u06cc\u0646 4 \u0645\u06ce\u06af\u0627\u0628\u0627\u06cc\u062a.',
    noImages: '\u0647\u06cc\u0686 \u0648\u06ce\u0646\u06d5\u06cc\u06d5\u06a9 \u0648\u06d5\u0631\u0646\u06d5\u06af\u06cc\u0631\u0627',
    extractFailed: 'دەرھێنانی دەق شکستی ھێنا',
    reportFailed: 'دروستکردنی ڕاپۆرت شکستی ھێنا',
    retryBtn: 'دووبارە هەوڵدانەوە',
    startOverBtn: 'دەستپێکردنەوە',
    retryTipUpload: 'تکایە هێڵەکەت پشکنین بکە و دووبارە هەوڵ بدە.',
    retryTipExtract: 'فایلەکانت بە سەرکەوتوویی بارکران. کلیک لەسەر دووبارە هەوڵدانەوە بکە بۆ دووبارە شیکردنەوە — پێویست بە بارکردنەوە ناکات.',
    retryTipReport: 'دەقەکە بە سەرکەوتوویی دەرکرا. کلیک لەسەر دووبارە هەوڵدانەوە بکە بۆ دروستکردنەوەی ڕاپۆرتەکە.',
  },
  kmr: {
    uploadTitle: 'R\u00fbpel\u00ean cerib\u00eendin\u00ea barkirin',
    uploadDesc: 'Hem\u00fb r\u00fbpel\u00ean cerib\u00eendin\u00ea bi hev re barkirin \u2013 bi kaş\u00eekirin an kl\u00eek',
    maxFileSize: 'Herî zêde 4,5 MB ji bo her dosyeyekê',
    addMore: 'R\u00fbpel\u00ean din zêde bikin',
    pdfConverting: 'PDF tê veguhertin...',
    aiRunning: 'Analîza AI-ê dimeşe',
    stepUpload: 'Dosye tên barkirin',
    stepExtract: 'Nivîs tê derxistin (AI)',
    stepReport: 'Rapor tê çêkirin (AI)',
    stepDone: 'Qediya!',
    btnUploading: 'Tê barkirin...',
    btnExtracting: 'Nivîs tê derxistin...',
    btnAnalyzing: 'Rapor tê çêkirin...',
    btnDone: 'Qediya!',
    analyzePage: '1 r\u00fbpelê analîz bike',
    analyzePages: 'r\u00fbpelan analîz bike',
    error: 'Çewtî',
    removeFile: 'Dosyeyê rake',
    preview: 'Pêşdîtin',
    fileTooLarge: 'Dosye divê ji 4,5 MB biçûktir be',
    onlyFormats: 'Tenê dosyeyên JPG, PNG û PDF têne pejirandin',
    totalSizeExceeded: 'ji sînorê 50 MB derbas dibe. Ji kerema xwe kalîteya wêneyê an hejmara rûpelan kêm bikin.',
    pdfFailed: 'Veguheztina PDF-ê bi ser neket',
    uploadFailed: 'Barkirin bi ser neket',
    serverError: 'Çewtiya serverê. Ji kerema xwe paşê dîsa biceribînin.',
    vercelLimit: 'Dosye pir mezin in. Vercel Free Tier herî zêde 4 MB destûrê dide.',
    noImages: 'Ji barkirinê wêne nehat wergirtin',
    extractFailed: 'Derxistina nivîsê bi ser neket',
    reportFailed: 'Çêkirina raporê bi ser neket',
    retryBtn: 'Dîsa biceribîne',
    startOverBtn: 'Ji nû ve dest pê bike',
    retryTipUpload: 'Ji kerema xwe girêdana xwe kontrol bikin û dîsa biceribînin.',
    retryTipExtract: 'Dosyeyên we bi serkeftî hatin barkirin. Ji bo ku analîzê ji nû ve bimeşînin li Dîsa biceribîne bikirtînin - ne hewce ye bu hûn ji nû ve bar bikin.',
    retryTipReport: 'Nivîs bi serkeftî hate derxistin. Ji bo çêkirina raporê li Dîsa biceribîne bikirtînin.',
  },
}

interface UploadResponse {
  success: boolean;
  uploadId: string;
  images?: { base64: string; mimeType: string; pageNumber: number }[];
  isDuplicate?: boolean;
  message?: string;
  error?: string;
}

type ProcessingStep = "idle" | "uploading" | "extracting" | "analyzing" | "complete" | "error";

// Validation schema is created per-render to use current language
const getFileSchema = (t: typeof uploadTexts['de']) => z.object({
  size: z.number().max(4718592, t.fileTooLarge),
  type: z.enum(["image/jpeg", "image/png", "application/pdf"], {
    message: t.onlyFormats
  }),
});

interface UploadZoneProps {
  childId: string;
  retryUploadId?: string;
}

const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

export default function UploadZone({ childId, retryUploadId }: UploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const [failedStep, setFailedStep] = useState<"uploading" | "extracting" | "analyzing" | null>(null);
  const [retryContext, setRetryContext] = useState<{ uploadId: string; images: { base64: string; mimeType: string; pageNumber: number }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { language } = useLanguage();
  const txt = uploadTexts[language] || uploadTexts['de'];

  // Configure PDF.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    // Clean up preview URLs on unmount
    return () => {
      previews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, []); // Empty deps - only run once on mount/unmount

  // Handle initialization from retry
  useEffect(() => {
    if (retryUploadId && processingStep === "idle") {
      setRetryContext({ uploadId: retryUploadId, images: [] });
      setFailedStep("analyzing");
      setProcessingStep("error");
      setError(txt.reportFailed); // Default assume report failed 
    }
  }, [retryUploadId, processingStep, txt.reportFailed]);

  const validateFile = (selectedFile: File): boolean => {
    setError(null);

    try {
      getFileSchema(txt).parse({
        size: selectedFile.size,
        type: selectedFile.type,
      });
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      }
      return false;
    }
  };

  // Convert PDF to images with optimized quality
  const convertPdfToImages = async (pdfFile: File): Promise<File[]> => {
    console.log('[PDF Convert] Starting conversion of:', pdfFile.name);
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const imageFiles: File[] = [];

    console.log(`[PDF Convert] PDF has ${pdf.numPages} page(s)`);

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`[PDF Convert] Processing page ${pageNum}/${pdf.numPages}`);
      const page = await pdf.getPage(pageNum);

      // Use moderate scale for good quality without huge file size (2.0 = ~150 DPI)
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: false })!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      console.log(`[PDF Convert] Canvas size: ${canvas.width}x${canvas.height}`);

      // Fill with white background first
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport: viewport,
        background: 'white'
      } as any).promise;

      // Convert canvas to blob with moderate quality to reduce file size
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          'image/jpeg',
          0.85 // Good quality but smaller files
        );
      });

      console.log(`[PDF Convert] Page ${pageNum} converted: ${(blob.size / 1024).toFixed(1)}KB`);

      // Validate the blob isn't empty
      if (blob.size < 1000) {
        throw new Error(`Page ${pageNum} produced suspiciously small image (${blob.size} bytes)`);
      }

      // Create File from blob
      const fileName = pdfFile.name.replace('.pdf', `_page${pageNum}.jpg`);
      const imageFile = new File([blob], fileName, { type: 'image/jpeg' });
      imageFiles.push(imageFile);

      console.log(`[PDF Convert] Added file: ${fileName}`);
    }

    console.log(`[PDF Convert] ✓ Conversion complete: ${imageFiles.length} image(s)`);
    return imageFiles;
  };

  const handleFileSelect = async (selectedFiles: File[]) => {
    setIsConverting(true);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const selectedFile of selectedFiles) {
      if (!validateFile(selectedFile)) {
        continue;
      }

      // Convert PDF to images
      if (selectedFile.type === 'application/pdf') {
        try {
          const imageFiles = await convertPdfToImages(selectedFile);
          for (const imageFile of imageFiles) {
            validFiles.push(imageFile);
            const previewUrl = URL.createObjectURL(imageFile);
            newPreviews.push(previewUrl);
          }
        } catch (err) {
          setError(`${txt.pdfFailed}: ${err instanceof Error ? err.message : txt.error}`);
          setIsConverting(false);
          return;
        }
      } else {
        validFiles.push(selectedFile);

        // Generate preview for images
        if (selectedFile.type.startsWith("image/")) {
          const previewUrl = URL.createObjectURL(selectedFile);
          newPreviews.push(previewUrl);
        } else {
          newPreviews.push('');
        }
      }
    }

    setFiles(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    setIsConverting(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const preview = prev[index];
      if (preview) URL.revokeObjectURL(preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(Array.from(selectedFiles));
    }
  };



  const handleUpload = async (isRetry = false) => {
    if (!isRetry && files.length === 0) return;

    if (!isRetry) {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        setError(`${(totalSize / 1024 / 1024).toFixed(1)} MB ${txt.totalSizeExceeded}`);
        return;
      }
    }

    setIsUploading(true);
    setError(null);
    
    // Determine starting context
    let currentUploadId = retryContext?.uploadId;
    let currentImages = retryContext?.images;

    // === STEP 1: Upload ===
    if (!isRetry || failedStep === "uploading" || !currentUploadId) {
      setProcessingStep("uploading");
      setFailedStep(null);
      
      try {
        console.log(`[UploadZone] Step 1: Uploading ${files.length} file(s)`);
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        formData.append("childId", childId);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const contentType = uploadRes.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await uploadRes.text();
          throw new Error(
            text.includes("Request Entity Too Large") || text.includes("413")
              ? txt.vercelLimit
              : txt.serverError
          );
        }

        const uploadData: UploadResponse = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || txt.uploadFailed);
        }

        const { uploadId, images } = uploadData;
        if (!images || images.length === 0) {
          throw new Error(txt.noImages);
        }

        console.log(`[UploadZone] Step 1 complete: uploadId=${uploadId}, ${images.length} images`);
        currentUploadId = uploadId;
        currentImages = images;
        
        // Save for future retries
        setRetryContext({ uploadId: currentUploadId, images: currentImages });
      } catch (err) {
        console.error("[UploadZone] Upload Error:", err);
        setError(err instanceof Error ? err.message : txt.uploadFailed);
        setProcessingStep("error");
        setFailedStep("uploading");
        setIsUploading(false);
        return;
      }
    }

    // === STEP 2: Extract ===
    if (!isRetry || ["uploading", "extracting"].includes(failedStep || "")) {
      setProcessingStep("extracting");
      setFailedStep(null);
      
      try {
        console.log("[UploadZone] Step 2: Extracting text from images...");
        const extractRes = await fetch("/api/analyze/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId: currentUploadId, images: currentImages, language }),
        });

        const extractData = await extractRes.json();
        if (!extractRes.ok || !extractData.success) {
          throw new Error(extractData.error || txt.extractFailed);
        }
        console.log(`[UploadZone] Step 2 complete: ${extractData.extractionLength} chars extracted`);
      } catch (err) {
        console.error("[UploadZone] Extract Error:", err);
        setError(err instanceof Error ? err.message : txt.extractFailed);
        setProcessingStep("error");
        setFailedStep("extracting");
        setIsUploading(false);
        return;
      }
    }

    // === STEP 3: Report ===
    if (!isRetry || ["uploading", "extracting", "analyzing"].includes(failedStep || "")) {
      setProcessingStep("analyzing");
      setFailedStep(null);
      
      try {
        console.log("[UploadZone] Step 3: Generating report...");
        // Wait, for step 3, we don't need `images` unless there's an issue with the endpoint missing it! Actually the endpoint only needs uploadId.
        const reportRes = await fetch("/api/analyze/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uploadId: currentUploadId }),
        });

        const reportData = await reportRes.json();
        if (!reportRes.ok || !reportData.success) {
          throw new Error(reportData.error || txt.reportFailed);
        }
        console.log(`[UploadZone] Step 3 complete: grade=${reportData.grade}`);
      } catch (err) {
        console.error("[UploadZone] Report Error:", err);
        setError(err instanceof Error ? err.message : txt.reportFailed);
        setProcessingStep("error");
        setFailedStep("analyzing");
        setIsUploading(false);
        return;
      }
    }

    // === DONE ===
    setProcessingStep("complete");
    previews.forEach((preview) => {
      if (preview) URL.revokeObjectURL(preview);
    });

    router.push(`/uploads/${currentUploadId}`);
  };

  const processingSteps = [
    { step: "uploading" as const, label: txt.stepUpload },
    { step: "extracting" as const, label: txt.stepExtract },
    { step: "analyzing" as const, label: txt.stepReport },
    { step: "complete" as const, label: txt.stepDone },
  ];

  return (
    <div className="w-full">
      {/* Error Message & Retry UI */}
      {error && failedStep && (
        <div className="mb-6 card-story overflow-hidden border-2 border-[var(--coral)]/30 bg-[var(--coral)]/5">
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--coral)]/10">
                <XCircle className="h-5 w-5 text-[var(--coral)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[var(--gray-900)] mb-1">
                  {failedStep === "uploading" ? txt.uploadFailed : 
                   failedStep === "extracting" ? txt.extractFailed : txt.reportFailed}
                </h3>
                <p className="text-sm text-[var(--gray-700)] mb-3">
                  {error}
                </p>
                <div className="rounded-lg bg-white/60 p-3 text-sm text-[var(--gray-600)] mb-4">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-[var(--coral)] flex-shrink-0 mt-0.5" />
                    <p>
                      {failedStep === "uploading" ? txt.retryTipUpload : 
                       failedStep === "extracting" ? txt.retryTipExtract : txt.retryTipReport}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleUpload(true)}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--coral)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--coral-dark)] disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {txt.retryBtn}
                  </button>
                  <button
                    onClick={() => {
                      setFailedStep(null);
                      setProcessingStep("idle");
                      setError(null);
                      if (retryUploadId) router.push('/dashboard');
                    }}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-[var(--gray-700)] shadow-sm ring-1 ring-inset ring-[var(--gray-300)] transition-colors hover:bg-[var(--gray-50)] disabled:opacity-50"
                  >
                    {txt.startOverBtn}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {error && !failedStep && (
        <div className="mb-6 card-story p-4 border-2 border-[var(--coral)]/30 bg-[var(--coral)]/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-[var(--coral)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-[var(--coral)] mb-1">
                {txt.error}
              </p>
              <p className="text-sm text-[var(--gray-700)]">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone or File Preview */}
      {files.length === 0 ? (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            card-story cursor-pointer border-2 border-dashed p-10 md:p-14 text-center transition-all
            ${
              isDragging
                ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-lg scale-[1.01]"
                : "border-[var(--gray-300)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/50 hover:shadow-md"
            }
          `}
        >
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${isDragging ? 'bg-[var(--primary)]/20' : 'bg-[var(--primary-soft)]'}`}>
            <Upload className={`h-8 w-8 transition-colors ${isDragging ? 'text-[var(--primary)]' : 'text-[var(--primary)]/70'}`} />
          </div>
          <h3 className="mb-2 text-xl font-bold text-[var(--gray-800)]" style={{ fontFamily: 'var(--font-display)' }}>
            {txt.uploadTitle}
          </h3>
          <p className="mb-4 text-[var(--gray-600)]">
            {txt.uploadDesc}
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-[var(--gray-500)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gray-100)] px-3 py-1">
              <FileImage className="h-3 w-3" /> JPG, PNG
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gray-100)] px-3 py-1">
              <FileText className="h-3 w-3" /> PDF
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gray-100)] px-3 py-1">
              {txt.maxFileSize}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleFileInputChange}
            multiple
            className="hidden"
          />
        </div>
      ) : (
        <div className="card-story p-6 space-y-4">
          {/* File List */}
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-start gap-4 p-3 bg-[var(--primary-soft)]/50 rounded-xl border border-[var(--gray-200)]">
                {/* Preview */}
                <div className="flex-shrink-0">
                  {previews[index] ? (
                    <img
                      src={previews[index]}
                      alt={txt.preview}
                      className="h-16 w-16 rounded-xl object-cover border border-[var(--gray-200)]"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--coral)]/10 border border-[var(--coral)]/20">
                      <FileText className="h-7 w-7 text-[var(--coral)]" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0 py-1">
                  <h4 className="text-sm font-semibold text-[var(--gray-800)] truncate">
                    {file.name}
                  </h4>
                  <p className="text-xs text-[var(--gray-500)] mt-0.5">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                  className="flex-shrink-0 rounded-lg p-1.5 text-[var(--gray-400)] transition-colors hover:bg-[var(--coral)]/10 hover:text-[var(--coral)] disabled:opacity-50"
                  aria-label={txt.removeFile}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          {!isUploading && !isConverting && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--gray-300)] bg-[var(--primary-soft)]/30 px-4 py-3 text-sm font-medium text-[var(--primary)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"
            >
              <Plus className="h-4 w-4" />
              {txt.addMore}
            </button>
          )}

          {/* Converting indicator */}
          {isConverting && (
            <div className="flex items-center justify-center gap-2 text-[var(--primary)] py-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">{txt.pdfConverting}</span>
            </div>
          )}

          {/* Processing Steps Indicator */}
          {processingStep !== "idle" && processingStep !== "error" && (
            <div className="rounded-xl bg-gradient-to-br from-[var(--primary-soft)] to-[var(--lavender)]/20 p-5 border border-[var(--primary)]/10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-[var(--primary)]" />
                <span className="text-sm font-semibold text-[var(--primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {txt.aiRunning}
                </span>
              </div>
              <div className="space-y-3">
                {processingSteps.map(({ step, label }) => {
                  const isActive = processingStep === step;
                  const isDone =
                    (step === "uploading" && ["extracting", "analyzing", "complete"].includes(processingStep)) ||
                    (step === "extracting" && ["analyzing", "complete"].includes(processingStep)) ||
                    (step === "analyzing" && processingStep === "complete");
                  return (
                    <div key={step} className={`flex items-center gap-3 text-sm transition-all ${isActive ? "text-[var(--primary)] font-semibold" : isDone ? "text-[var(--sage)]" : "text-[var(--gray-400)]"}`}>
                      {isActive ? (
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                      ) : isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-[var(--sage)]" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={() => handleUpload(false)}
            disabled={isUploading || isConverting}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-lg font-semibold shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {processingStep === "uploading" && txt.btnUploading}
                {processingStep === "extracting" && txt.btnExtracting}
                {processingStep === "analyzing" && txt.btnAnalyzing}
                {processingStep === "complete" && txt.btnDone}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {files.length === 1 ? txt.analyzePage : `${files.length} ${txt.analyzePages}`}
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleFileInputChange}
            multiple
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
