import { Linking, Alert } from 'react-native';

/**
 * Starts a video call using Jitsi Meet via deep linking.
 * This approach works flawlessly in Expo Go without requiring native modules.
 * 
 * @param {string} roomId - A unique identifier for the room.
 */
export const startVideoCall = async (roomId) => {
  if (!roomId) {
    Alert.alert('Error', 'Room ID is required to start a video call.');
    return;
  }

  // Remove spaces or special characters to create a valid Jitsi room name
  const cleanRoomId = roomId.replace(/[^a-zA-Z0-9]/g, '');
  const jitsiUrl = `https://meet.jit.si/VirtualCare_Consult_${cleanRoomId}`;

  try {
    const supported = await Linking.canOpenURL(jitsiUrl);
    if (supported) {
      await Linking.openURL(jitsiUrl);
    } else {
      Alert.alert('Error', 'Cannot open the video call link on this device.');
    }
  } catch (error) {
    console.error('An error occurred while opening the video call link:', error);
    Alert.alert('Error', 'Failed to launch the video call.');
  }
};
