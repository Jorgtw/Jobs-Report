// src/i18n/tr/communications.ts
export const communications = {
  // Menü ve Dashboard
  internalCommunications: 'İç İletişim',
  internalCommunicationsDesc: 'Şirket mesajlarını gerçek zamanlı gönderin ve alın',
  newCommunication: 'Yeni İletişim',
  
  // Gönderim Formu
  sendTo: 'Gönderilecek kişi',
  recipient: 'Alıcı',
  subject: 'Konu',
  message: 'Mesaj',
  selectUsers: 'İş arkadaşı seçin',
  allUsers: 'Tüm kullanıcılar',
  placeholderSelectUsers: 'Bir veya daha fazla kullanıcı seçin...',
  
  // Tipler ve Sekmeler
  todo: 'Yapılacaklar',
  sent: 'Gönderilenler',
  inbox: 'Gelen Kutusu',
  outbox: 'Gönderilenler',
  archive: 'Arşiv',
  thread: 'Konuşma',
  messagesTab: 'Mesajlar',
  internalCommunication: 'İç İletişim',
  
  // Özel Tipler
  type_note: 'Not',
  type_issue: 'Sorun Bildirimi',
  type_confirmation: 'Onay',
  
  // Tablo ve Detaylar
  sender: 'Gönderen',
  type: 'Tür',
  allTeam: 'Tüm Ekip',
  myself: 'Kendim',
  recipientLabel: 'Alıcı',
  waitingYourReply: 'yanıtınız bekleniyor',
  waitingOthersReply: 'başkalarının yanıtı bekleniyor',
  actionRequired: 'Eylem Gerekiyor',
  note: 'Not',
  issue: 'Sorun',
  confirmation: 'Onay',
  writeMessage: 'Bir mesaj yazın...',
  noThreadSelected: 'Detayları görüntülemek için bir konuşma seçin',
  exportHistory: 'PDF Geçmişini Dışa Aktar',
  loading: 'Yükleniyor...',
  
  // Aksiyonlar
  acknowledge: 'Alındığını Onayla',
  takeInCharge: 'Üstlen',
  close: 'Kapat',
  archive: 'Arşivle',
  closed: 'Kapalı',
  archiveCommunication: 'Arşivle',
  send: 'Gönder',
  
  // Durumlar ve Geri Bildirim
  noCommunicationsYet: 'Henüz iletişim yok',
  no_workers_available: 'Mevcut iş arkadaşı yok',
  unreadMessages: 'Okunmamış mesajlar',
  messageSentSuccess: 'İletişim başarıyla gönderildi!',
  
  // Çalışma Durumları
  status_open: 'Açık',
  status_acknowledged: 'Alındı',
  status_in_progress: 'Devam Ediyor',
  status_closed: 'Kapalı',
  status_archived: 'Arşivlendi',
  status_deleted: 'Silindi',

  // Paywall ve Premium
  premiumFeature: 'Premium Özellik',
  premiumRequiredDesc: 'Bu özellik yalnızca Premium aboneliği olan şirketler için mevcuttur.',
  upgradeNow: 'Premium\'a Yükselt',
  unlockFullPotential: 'Şirketinizin tüm potansiyelini açığa çıkarın',
  lockFeatureTip: 'Premium şirketler tek bir tıklamayla tüm ekiple iletişim kurabilir.',
  
  // Yükseltme Modalı Özel
  upgradeTitle: 'Premium Özellik',
  upgradeDesc: 'Bu özellik (Fotoğraf + İmza + Profesyonel PDF) Premium hesaplar için ayrılmıştır.',
  upgradeCTA: 'Bağış ile Kilidi Aç'
} as const;
