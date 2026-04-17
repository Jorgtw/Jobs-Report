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
  takeInCharge: 'İşlemde',
  close: 'Kapat',
  archiveAction: 'Arşivle',
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
  upgradeCTA: 'Bağış ile Kilidi Aç',
  read_at: 'Okundu',
  thread_closed_msg: 'Bu konuşma kapatıldı. Döngüyü tamamlamak için arşivleyin.',
  thread_archived_msg: 'Konuşma arşivlendi.',
  feature_ticket_title: 'Ticket & Thread',
  feature_ticket_desc: 'Her talep için yapılandırılmış konuşmaları yönetin',
  feature_teamsync_title: 'Ekip Senkronizasyonu',
  feature_teamsync_desc: 'Tüm ekibe veya belirli projelere uyarı gönderin',
  feature_pdf_title: 'PDF Dışa Aktar',
  feature_pdf_desc: 'Konuşma günlüklerini PDF formatında indirin',
  tab_inbox: 'GELEN',
  tab_sent: 'GÖNDERİLEN',
  tab_working: 'SÜREÇTE',
  tab_waiting: 'BEKLEYEN',
  tab_completed: 'TAMAM',
  workingTooltip: 'Bu iletiyi işlem aşamasına taşı',
  forward: 'İlet',
  forwardAction: 'İletiyi gönder',
  additionalMessage: 'Ek mesaj (isteğe bağlı)',
  push_banner_title: 'Push bildirimlerini etkinleştir',
  push_banner_desc: 'Uygulama kapalıyken bile gerçek zamanlı güncellemeler alın.',
  push_activate: 'Şimdi etkinleştir',
  push_dismiss: 'Şimdi değil',
  push_enabled: 'Bildirimler etkinleştirildi!',
  push_settings_title: 'Bildirim Ayarları',
  push_notifications: 'Push Bildirimleri',
  push_status_active: 'Bildirimler Aktif',
  push_status_blocked: 'Yetkisiz',
  push_status_disabled: 'Kullanıcı tarafından devre dışı bırakıldı',
  push_deactivate: 'Bildirimleri Devre Dışı Bırak',
  push_reset_hint: 'Tarayıcı ayarlarından bildirimlerin engelini kaldırın',
  push_sound: 'Bildirim Sesi',
  push_sound_desc: 'Alındığında bir sesli uyarı çal'
} as const;
