const whatsappConfig = {
  mainNumber: '0549699855',
  groups: {
    prophetic: 'https://chat.whatsapp.com/CdSOrBzYZI154RlCAmrIqH?s=cl&p=a&ilr=0',
    apostolic: 'YOUR_APOSTOLIC_GROUP_LINK_HERE',
    evangelists: 'YOUR_EVANGELISTS_GROUP_LINK_HERE',
    pastors: 'YOUR_PASTORS_GROUP_LINK_HERE'
  }
};

function buildMainWhatsAppLink(text) {
  if (whatsappConfig.mainNumber && !whatsappConfig.mainNumber.includes('YOUR_')) {
    return `https://wa.me/${whatsappConfig.mainNumber}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function buildGroupWhatsAppLink(target) {
  if (target && !target.includes('YOUR_')) {
    return target;
  }
  return 'https://chat.whatsapp.com/';
}

function buildPrayerWhatsAppLink(text) {
  return buildMainWhatsAppLink(text);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-whatsapp-main]').forEach((link) => {
    const text = link.getAttribute('data-whatsapp-text') || 'Hello, I would like to connect.';
    link.href = buildMainWhatsAppLink(text);
  });

  document.querySelectorAll('[data-whatsapp-group]').forEach((link) => {
    const groupKey = link.getAttribute('data-whatsapp-group');
    link.href = buildGroupWhatsAppLink(whatsappConfig.groups[groupKey]);
  });

  document.querySelectorAll('[data-whatsapp-prayer]').forEach((link) => {
    const text = link.getAttribute('data-whatsapp-text') || 'Hello, I would like to submit a prayer request.';
    link.href = buildPrayerWhatsAppLink(text);
  });
});
