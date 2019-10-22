export enum EPayoutStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    PENDING = 'PENDING',
    UNCLAIMED = 'UNCLAIMED',
    RETURNED = 'RETURNED',
    ONHOLD = 'ONHOLD',
    BLOCKED = 'BLOCKED',
    REFUNDED = 'REFUNDED',
    REVERSED = 'REVERSED',
}

// @name transaction_status
// @type enum
// @description The transaction status. The possible values are:
// SUCCESS. Funds have been credited to the recipient’s account.
// FAILED. This payout request has failed, so funds were not deducted from the sender’s account.
// PENDING. Your payout request was received and will be processed.
// UNCLAIMED. The recipient for this payout does not have a PayPal account
// RETURNED. The recipient has not claimed this payout, so the funds have been returned to your account
// ONHOLD This payout request is being reviewed and is on hold.
// BLOCKED. This payout request has been blocked.
// REFUNDED This payout request was refunded.
// REVERSED This payout request was reversed.
// A link to sign up for a PayPal account was sent to the recipient. However, if the recipient does not claim this payout within 30 days, the funds are returned to your account.
