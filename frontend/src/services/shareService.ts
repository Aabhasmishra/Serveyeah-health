import { Linking, Share, Alert } from 'react-native';
import { CAMP_DETAILS } from '../constants/campDetails';

function buildCampShareMessage(): string {
  const lines = [
    CAMP_DETAILS.appName,
    CAMP_DETAILS.tagline,
    '',
    CAMP_DETAILS.campTitle,
    '',
    `📅 ${CAMP_DETAILS.campDate}`,
    `📍 ${CAMP_DETAILS.campLocation}`,
    '',
    'Organized by:',
    CAMP_DETAILS.institution1,
    CAMP_DETAILS.conjunction,
    CAMP_DETAILS.institution2,
    '',
    CAMP_DETAILS.campCategory,
  ];
  return lines.join('\n');
}

export async function shareCampViaWhatsApp(): Promise<void> {
  const message = buildCampShareMessage();
  const encodedMessage = encodeURIComponent(message);

  // 1) Try WhatsApp deep link (works directly if WhatsApp is installed)
  const whatsappDeepLink = `whatsapp://send?text=${encodedMessage}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappDeepLink);
    if (canOpen) {
      await Linking.openURL(whatsappDeepLink);
      return;
    }
  } catch (error) {
    console.error('WhatsApp deep link error:', error);
  }

  // 2) Fallback: open WhatsApp web URL (opens browser, user can scan with WhatsApp Web)
  const whatsappWebUrl = `https://wa.me/?text=${encodedMessage}`;

  try {
    const canOpenWeb = await Linking.canOpenURL(whatsappWebUrl);
    if (canOpenWeb) {
      await Linking.openURL(whatsappWebUrl);
      return;
    }
  } catch (error) {
    console.error('WhatsApp web URL error:', error);
  }

  // 3) Final fallback: system share sheet with the same text
  try {
    await Share.share({ message });
  } catch (error) {
    Alert.alert(
      'Sharing Unavailable',
      'WhatsApp does not appear to be installed. The message has been copied to your clipboard for sharing.'
    );
  }
}
