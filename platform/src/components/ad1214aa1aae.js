import { RtcTokenBuilder, RtcRole } from 'agora-token';
export class AgoraService {
    get appId() {
        return process.env.AGORA_APP_ID || '';
    }
    get appCertificate() {
        return process.env.AGORA_APP_CERTIFICATE || '';
    }
    ensureConfigured() {
        if (!this.appId) {
            throw new Error('AGORA_APP_ID is not configured');
        }
        if (!this.appCertificate) {
            throw new Error('AGORA_APP_CERTIFICATE is not configured');
        }
    }
    userIdToUid(userId) {
        const hex = userId.replace(/-/g, '').slice(0, 8);
        const num = parseInt(hex, 16);
        return num === 0 ? 1 : num >>> 0;
    }
    generateToken(options) {
        this.ensureConfigured();
        const expiration = options.expirationSeconds ?? 3600;
        const token = RtcTokenBuilder.buildTokenWithUid(this.appId, this.appCertificate, options.channelName, options.uid, RtcRole.PUBLISHER, expiration, expiration);
        return {
            token,
            channelName: options.channelName,
            uid: options.uid,
            appId: this.appId,
        };
    }
    channelNameForSession(sessionId) {
        return `session-${sessionId}`;
    }
}
export const agoraService = new AgoraService();
