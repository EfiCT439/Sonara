import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Alert,
  Modal, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import api from '../../services/api';
import { auth } from '../../firebaseConfig';

// ─── Data ─────────────────────────────────────────────────────────────────────
const FREE_FEATURES = [
  { label: 'Stream music online', ok: true },
  { label: 'Next button', ok: true },
  { label: 'Lyrics while playing', ok: true },
  { label: 'Like & save songs', ok: true },
  { label: 'Sleep timer', ok: true },
  { label: '8 skips per hour', ok: false },
  { label: 'Ads every 3 songs', ok: false },
  { label: 'No backward skip', ok: false },
  { label: 'No playlist creation', ok: false },
];

const PREMIUM_FEATURES = [
  { label: 'Everything in Free', ok: true },
  { label: 'Unlimited skips', ok: true },
  { label: 'Backward button', ok: true },
  { label: 'Create playlists', ok: true },
  { label: 'Audio/Video switch', ok: true },
  { label: 'No ads ever', ok: true },
  { label: 'Offline downloads', ok: true },
  { label: 'AI lyrics generator', ok: true },
  { label: 'Song recognition', ok: true },
];

const METHODS = [
  { key: 'card',   icon: 'card',          label: 'Credit / Debit Card',  desc: 'Visa, Mastercard, Verve',          color: '#1DB954' },
  { key: 'mtn',   icon: 'phone-portrait', label: 'MTN Mobile Money',     desc: 'Nigeria (USSD) & Cameroon (push)', color: '#FFCC00' },
  { key: 'orange', icon: 'phone-portrait', label: 'Orange Money',         desc: 'Cameroon only · +237 prefix',      color: '#FF6600' },
  { key: 'bank',  icon: 'business',       label: 'Bank Transfer',        desc: 'All local banks · Manual review',  color: '#3B82F6' },
];

// ─── Module-scope sub-components (TextInput keyboard-bug rule) ────────────────
function PhoneField({ value, onChangeText, placeholder }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#444"
      keyboardType="phone-pad"
      autoCorrect={false}
    />
  );
}

function CardNameField({ value, onChangeText }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder="Cardholder name"
      placeholderTextColor="#444"
      autoCapitalize="words"
      autoCorrect={false}
    />
  );
}

function CardNumField({ value, onChangeText }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder="1234 5678 9012 3456"
      placeholderTextColor="#444"
      keyboardType="numeric"
      maxLength={19}
    />
  );
}

function CardExpiryField({ value, onChangeText }) {
  return (
    <TextInput
      style={[ss.input, { flex: 1, marginBottom: 0 }]}
      value={value}
      onChangeText={onChangeText}
      placeholder="MM/YY"
      placeholderTextColor="#444"
      keyboardType="numeric"
      maxLength={5}
    />
  );
}

function CardCVVField({ value, onChangeText }) {
  return (
    <TextInput
      style={[ss.input, { flex: 1, marginBottom: 0 }]}
      value={value}
      onChangeText={onChangeText}
      placeholder="CVV"
      placeholderTextColor="#444"
      keyboardType="numeric"
      maxLength={4}
      secureTextEntry
    />
  );
}

function BankNameField({ value, onChangeText, placeholder }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#444"
      autoCapitalize="words"
      autoCorrect={false}
    />
  );
}

function BankAcctNameField({ value, onChangeText }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder="Account holder name"
      placeholderTextColor="#444"
      autoCapitalize="words"
      autoCorrect={false}
    />
  );
}

function BankAcctNumField({ value, onChangeText, placeholder }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#444"
      keyboardType="numeric"
      maxLength={12}
    />
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PaywallScreen({ navigation }) {
  const { isPremium, setIsPremium } = useUser();
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Sheet / modal
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [activeModal, setActiveModal]           = useState(null); // 'card' | 'mtn' | 'orange' | 'bank'

  // Mobile money (shared for MTN & Orange)
  const [phone, setPhone]       = useState('');
  const [mmLoading, setMmLoading] = useState(false);
  const [mmPhase, setMmPhase]   = useState('idle'); // idle | pending | success | failed
  const [mmMessage, setMmMessage] = useState('');
  const pollingRef = useRef(null);

  // Card
  const [cardName,    setCardName]    = useState('');
  const [cardNum,     setCardNum]     = useState('');
  const [cardExpiry,  setCardExpiry]  = useState('');
  const [cardCVV,     setCardCVV]     = useState('');
  const [cardLoading, setCardLoading] = useState(false);
  const [cardPhase,   setCardPhase]   = useState('idle'); // idle | success

  // Bank transfer — user enters their own bank details
  const [bankCountry,  setBankCountry]  = useState('ng'); // ng | cm
  const [bankName,     setBankName]     = useState('');
  const [bankAcctName, setBankAcctName] = useState('');
  const [bankAcctNum,  setBankAcctNum]  = useState('');
  const [bankDone,     setBankDone]     = useState(false);

  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const formatCardNum = (t) => {
    const d = t.replace(/\D/g, '').slice(0, 16);
    return d.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (t) => {
    const d = t.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) return d.slice(0, 2) + '/' + d.slice(2);
    return d;
  };

  const openMethod = (key) => {
    setShowPaymentSheet(false);
    setPhone(''); setMmLoading(false); setMmPhase('idle'); setMmMessage('');
    if (pollingRef.current) clearInterval(pollingRef.current);
    setCardName(''); setCardNum(''); setCardExpiry(''); setCardCVV('');
    setCardLoading(false); setCardPhase('idle');
    setBankCountry('ng'); setBankName(''); setBankAcctName(''); setBankAcctNum(''); setBankDone(false);
    setActiveModal(key);
  };

  const closeModal = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setMmPhase('idle'); setCardPhase('idle'); setBankDone(false);
    setActiveModal(null);
  };

  const handleMobileMoneyPay = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      Alert.alert('Invalid Number', 'Enter a valid phone number with country code (e.g. +237 or +234).');
      return;
    }
    const email = auth.currentUser?.email || '';
    setMmLoading(true);
    const result = await api.initiateMobileMoney({ phone: cleanPhone, email });
    setMmLoading(false);

    if (!result?.txRef) {
      Alert.alert('Error', result?.error || 'Could not initiate payment. Check that the backend is running.');
      return;
    }
    setMmPhase('pending');
    setMmMessage(result.message || 'Check your phone for the payment prompt and approve to complete.');

    pollingRef.current = setInterval(async () => {
      const s = await api.checkMobileMoneyStatus(result.txRef);
      if (s?.status === 'successful' || s?.isPremium) {
        clearInterval(pollingRef.current);
        setMmPhase('success');
        setIsPremium(true);
      } else if (s?.status === 'failed') {
        clearInterval(pollingRef.current);
        setMmPhase('failed');
        setMmMessage('Payment was not completed. Please try again.');
      }
    }, 3000);
  };

  const handleCardPay = async () => {
    if (!cardName.trim()) { Alert.alert('Missing field', 'Enter the cardholder name.'); return; }
    if (cardNum.replace(/\s/g, '').length < 16) { Alert.alert('Invalid card', 'Enter a valid 16-digit card number.'); return; }
    if (!cardExpiry.includes('/') || cardExpiry.length < 5) { Alert.alert('Invalid expiry', 'Enter expiry as MM/YY.'); return; }
    if (cardCVV.length < 3) { Alert.alert('Invalid CVV', 'Enter a 3 or 4-digit CVV.'); return; }

    setCardLoading(true);
    const email = auth.currentUser?.email || '';
    const result = await api.initiateCardPayment(email);
    setCardLoading(false);

    if (result?.paymentLink) {
      Linking.openURL(result.paymentLink).catch(() =>
        Alert.alert('Error', 'Could not open payment page. Try another method.')
      );
      setTimeout(async () => {
        const ok = await api.checkPremium(email);
        if (ok) { setIsPremium(true); setCardPhase('success'); }
      }, 6000);
    } else {
      Alert.alert('Card Payment', 'Card payment via Flutterwave will be enabled after backend deployment. Please use Mobile Money for now.');
    }
  };

  const handleBankSubmit = () => {
    if (!bankName.trim()) { Alert.alert('Missing field', 'Enter your bank name.'); return; }
    if (!bankAcctName.trim()) { Alert.alert('Missing field', 'Enter the account holder name.'); return; }
    const minLen = bankCountry === 'ng' ? 10 : 9;
    if (bankAcctNum.replace(/\D/g, '').length < minLen) {
      Alert.alert('Invalid account', `Enter a valid account number (${minLen}+ digits).`);
      return;
    }
    setBankDone(true);
  };

  if (isPremium) {
    return (
      <View style={styles.alreadyPremium}>
        <Ionicons name="diamond" size={64} color="#FFD700" />
        <Text style={styles.alreadyPremiumTitle}>You're Premium! 🎉</Text>
        <Text style={styles.alreadyPremiumSub}>Enjoy all features with no limits.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>Back to Sonara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mmLabel = activeModal === 'mtn' ? 'MTN Mobile Money' : 'Orange Money';
  const mmColor = activeModal === 'mtn' ? '#FFCC00' : '#FF6600';
  const mmHint  = activeModal === 'orange' ? '+237 prefix required (Cameroon)' : '🇳🇬 Nigeria: +234 · 🇨🇲 Cameroon: +237';
  const mmPlaceholder = activeModal === 'orange' ? '+237 6XX XXX XXX' : '+237 or +234...';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.crownCircle}>
            <Ionicons name="diamond" size={40} color="#FFD700" />
          </View>
          <Text style={styles.heroTitle}>Sonara Premium</Text>
          <Text style={styles.heroPrice}>$1 <Text style={styles.heroPriceSub}>/month</Text></Text>
          <Text style={styles.heroTagline}>Cancel anytime. No hidden fees.</Text>
        </Animated.View>

        {/* Comparison table */}
        <View style={styles.comparison}>
          <View style={styles.tierCard}>
            <Text style={styles.tierName}>Free</Text>
            <Text style={styles.tierPrice}>$0</Text>
            <View style={styles.featureList}>
              {FREE_FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name={f.ok ? 'checkmark-circle' : 'close-circle'} size={15}
                    color={f.ok ? '#1DB954' : '#444'} />
                  <Text style={[styles.featureText, !f.ok && styles.featureTextMuted]}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.tierCard, styles.premiumTierCard]}>
            <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>BEST</Text></View>
            <Ionicons name="diamond" size={18} color="#FFD700" style={{ marginBottom: 4 }} />
            <Text style={[styles.tierName, styles.premiumTierName]}>Premium</Text>
            <Text style={[styles.tierPrice, styles.premiumTierPrice]}>$1</Text>
            <View style={styles.featureList}>
              {PREMIUM_FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={15} color="#1DB954" />
                  <Text style={styles.featureText}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => setShowPaymentSheet(true)} activeOpacity={0.85}>
          <Ionicons name="flash" size={20} color="#000" />
          <Text style={styles.ctaBtnText}>Upgrade Now — $1/month</Text>
        </TouchableOpacity>
        <Text style={styles.ctaDisclaimer}>Cancel anytime · No hidden fees · Secure payments</Text>
      </View>

      {/* ── Payment Method Selection Sheet ─────────────────────────────────── */}
      <Modal
        visible={showPaymentSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentSheet(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowPaymentSheet(false)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Choose Payment Method</Text>
            <Text style={styles.sheetSub}>$1/month · Cancel anytime</Text>

            {METHODS.map((m) => (
              <TouchableOpacity key={m.key} style={styles.methodRow} onPress={() => openMethod(m.key)} activeOpacity={0.7}>
                <View style={[styles.methodIcon, { backgroundColor: m.color + '20' }]}>
                  <Ionicons name={m.icon} size={22} color={m.color} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Text style={styles.methodDesc}>{m.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#444" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowPaymentSheet(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Mobile Money Modal (MTN + Orange) ──────────────────────────────── */}
      <Modal
        visible={activeModal === 'mtn' || activeModal === 'orange'}
        transparent
        animationType="slide"
        onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={(mmPhase === 'idle' || mmPhase === 'failed') ? closeModal : undefined}>
            <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
              <View style={styles.sheetHandle} />

              <View style={styles.modalHeader}>
                <View style={[styles.modalIconCircle, { backgroundColor: mmColor + '20' }]}>
                  <Ionicons name="phone-portrait" size={26} color={mmColor} />
                </View>
                <Text style={styles.sheetTitle}>{mmLabel}</Text>
                {activeModal === 'orange' && (
                  <View style={styles.cmBadge}><Text style={styles.cmBadgeText}>🇨🇲 Cameroon Only</Text></View>
                )}
              </View>

              {mmPhase === 'success' ? (
                <View style={styles.successWrap}>
                  <Ionicons name="checkmark-circle" size={56} color="#1DB954" />
                  <Text style={styles.successTitle}>Payment Successful!</Text>
                  <Text style={styles.successMsg}>Welcome to Sonara Premium. All features are now unlocked.</Text>
                  <TouchableOpacity style={styles.successBtn} onPress={() => { closeModal(); navigation.goBack(); }} activeOpacity={0.85}>
                    <Text style={styles.successBtnText}>Start Listening</Text>
                  </TouchableOpacity>
                </View>
              ) : mmPhase === 'pending' ? (
                <View style={styles.pendingWrap}>
                  <ActivityIndicator size="large" color="#1DB954" style={{ marginBottom: 16 }} />
                  <Text style={styles.pendingTitle}>Waiting for Confirmation</Text>
                  <Text style={styles.pendingMsg}>{mmMessage}</Text>
                  <TouchableOpacity style={styles.sheetCancel} onPress={() => {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setMmPhase('idle');
                  }}>
                    <Text style={styles.sheetCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={ss.fieldLabel}>Phone Number</Text>
                  <PhoneField value={phone} onChangeText={setPhone} placeholder={mmPlaceholder} />
                  <Text style={ss.fieldHint}>{mmHint}</Text>

                  {mmPhase === 'failed' && <Text style={ss.errorText}>{mmMessage}</Text>}

                  <TouchableOpacity
                    style={[styles.payBtn, { backgroundColor: mmColor }, mmLoading && styles.payBtnDisabled]}
                    onPress={handleMobileMoneyPay}
                    disabled={mmLoading}
                    activeOpacity={0.85}>
                    {mmLoading
                      ? <ActivityIndicator color="#000" size="small" />
                      : <><Ionicons name="send" size={16} color="#000" /><Text style={[styles.payBtnText, { color: '#000' }]}>Send Payment Request</Text></>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetCancel} onPress={closeModal}>
                    <Text style={styles.sheetCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Card Payment Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={activeModal === 'card'}
        transparent
        animationType="slide"
        onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={cardPhase === 'idle' ? closeModal : undefined}>
            <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
              <View style={styles.sheetHandle} />

              <View style={styles.modalHeader}>
                <View style={[styles.modalIconCircle, { backgroundColor: '#1DB95420' }]}>
                  <Ionicons name="card" size={26} color="#1DB954" />
                </View>
                <Text style={styles.sheetTitle}>Credit / Debit Card</Text>
              </View>

              {cardPhase === 'success' ? (
                <View style={styles.successWrap}>
                  <Ionicons name="checkmark-circle" size={56} color="#1DB954" />
                  <Text style={styles.successTitle}>Payment Confirmed!</Text>
                  <Text style={styles.successMsg}>Premium is now active on your account.</Text>
                  <TouchableOpacity style={styles.successBtn} onPress={() => { closeModal(); navigation.goBack(); }} activeOpacity={0.85}>
                    <Text style={styles.successBtnText}>Start Listening</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={ss.fieldLabel}>Cardholder Name</Text>
                  <CardNameField value={cardName} onChangeText={setCardName} />

                  <Text style={ss.fieldLabel}>Card Number</Text>
                  <CardNumField value={cardNum} onChangeText={(t) => setCardNum(formatCardNum(t))} />

                  <View style={{ flexDirection: 'row', marginBottom: 14 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={ss.fieldLabel}>Expiry</Text>
                      <CardExpiryField value={cardExpiry} onChangeText={(t) => setCardExpiry(formatExpiry(t))} />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={ss.fieldLabel}>CVV</Text>
                      <CardCVVField value={cardCVV} onChangeText={setCardCVV} />
                    </View>
                  </View>

                  <Text style={ss.fieldHint}>🔒 Card details processed securely via Flutterwave</Text>

                  <TouchableOpacity
                    style={[styles.payBtn, cardLoading && styles.payBtnDisabled]}
                    onPress={handleCardPay}
                    disabled={cardLoading}
                    activeOpacity={0.85}>
                    {cardLoading
                      ? <ActivityIndicator color="#000" size="small" />
                      : <><Ionicons name="lock-closed" size={16} color="#000" /><Text style={styles.payBtnText}>Pay Securely — $1</Text></>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetCancel} onPress={closeModal}>
                    <Text style={styles.sheetCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Bank Transfer Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={activeModal === 'bank'}
        transparent
        animationType="slide"
        onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={bankDone ? undefined : closeModal}>
            <TouchableOpacity style={[styles.sheet, { paddingBottom: 36 }]} activeOpacity={1} onPress={() => {}}>
              <View style={styles.sheetHandle} />

              <View style={styles.modalHeader}>
                <View style={[styles.modalIconCircle, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="business" size={26} color="#3B82F6" />
                </View>
                <Text style={styles.sheetTitle}>Bank Transfer</Text>
              </View>

              {bankDone ? (
                <View style={styles.pendingWrap}>
                  <Ionicons name="time-outline" size={52} color="#FFD700" style={{ marginBottom: 12 }} />
                  <Text style={styles.pendingTitle}>Details Submitted</Text>
                  <Text style={styles.pendingMsg}>
                    We'll verify your bank details and activate Premium within 24 hours. You'll be notified by email.
                  </Text>
                  <TouchableOpacity style={styles.sheetCancel} onPress={closeModal}>
                    <Text style={styles.sheetCancelText}>Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <View style={styles.countryTabs}>
                    <TouchableOpacity
                      style={[styles.countryTab, bankCountry === 'ng' && styles.countryTabActive]}
                      onPress={() => setBankCountry('ng')}>
                      <Text style={[styles.countryTabText, bankCountry === 'ng' && styles.countryTabTextActive]}>🇳🇬 Nigeria</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.countryTab, bankCountry === 'cm' && styles.countryTabActive]}
                      onPress={() => setBankCountry('cm')}>
                      <Text style={[styles.countryTabText, bankCountry === 'cm' && styles.countryTabTextActive]}>🇨🇲 Cameroon</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={ss.fieldLabel}>{bankCountry === 'ng' ? 'Bank Name' : 'Bank / Service'}</Text>
                  <BankNameField
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder={bankCountry === 'ng' ? 'e.g. GTBank, Access Bank' : 'e.g. Afriland, Express Union'}
                  />

                  <Text style={ss.fieldLabel}>Account Holder Name</Text>
                  <BankAcctNameField value={bankAcctName} onChangeText={setBankAcctName} />

                  <Text style={ss.fieldLabel}>Account Number</Text>
                  <BankAcctNumField
                    value={bankAcctNum}
                    onChangeText={(t) => setBankAcctNum(t.replace(/\D/g, ''))}
                    placeholder={bankCountry === 'ng' ? '10-digit NUBAN' : 'Your account number'}
                  />

                  <Text style={ss.fieldHint}>
                    🔒 Enter your own bank details. We'll debit {bankCountry === 'ng' ? '₦1,500' : 'XAF 1,000'} and activate Premium after verification.
                  </Text>

                  <TouchableOpacity
                    style={[styles.payBtn, { backgroundColor: '#3B82F6' }]}
                    onPress={handleBankSubmit}
                    activeOpacity={0.85}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={[styles.payBtnText, { color: '#fff' }]}>Submit Bank Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetCancel} onPress={closeModal}>
                    <Text style={styles.sheetCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },

  hero: { alignItems: 'center', marginBottom: 32 },
  crownCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#FFD70020', borderWidth: 2, borderColor: '#FFD70060',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  heroTitle:    { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 0.5, marginBottom: 8 },
  heroPrice:    { fontSize: 42, fontWeight: '900', color: '#FFD700', marginBottom: 6 },
  heroPriceSub: { fontSize: 18, fontWeight: '500', color: '#888' },
  heroTagline:  { fontSize: 13, color: '#666' },

  comparison: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  tierCard: {
    flex: 1, backgroundColor: '#161616', borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: '#2A2A2A',
  },
  premiumTierCard: { borderColor: '#FFD700', backgroundColor: '#1a1600' },
  bestBadge: {
    backgroundColor: '#FFD700', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8,
  },
  bestBadgeText:    { color: '#000', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  tierName:         { fontSize: 16, fontWeight: '700', color: '#888', marginBottom: 4 },
  premiumTierName:  { color: '#FFD700' },
  tierPrice:        { fontSize: 22, fontWeight: '900', color: '#666', marginBottom: 14 },
  premiumTierPrice: { color: '#FFD700' },
  featureList:  { gap: 9 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureText:  { fontSize: 11, color: '#ccc', flex: 1 },
  featureTextMuted: { color: '#444' },

  ctaWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0A0A0A', paddingHorizontal: 20,
    paddingTop: 14, paddingBottom: 34,
    borderTopWidth: 1, borderTopColor: '#1A1A1A',
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#FFD700', paddingVertical: 16, borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  ctaBtnText:    { color: '#000', fontSize: 17, fontWeight: '800' },
  ctaDisclaimer: { color: '#555', fontSize: 11, textAlign: 'center' },

  // Sheet / overlay
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#333', alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle:      { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4, textAlign: 'center' },
  sheetSub:        { fontSize: 13, color: '#555', marginBottom: 20, textAlign: 'center' },
  sheetCancel:     { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  sheetCancelText: { color: '#555', fontSize: 14, fontWeight: '600' },

  methodRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  methodIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  methodInfo:  { flex: 1 },
  methodLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  methodDesc:  { fontSize: 12, color: '#555', marginTop: 2 },

  // Modal header
  modalHeader:     { alignItems: 'center', marginBottom: 20 },
  modalIconCircle: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  cmBadge:     { backgroundColor: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  cmBadgeText: { fontSize: 12, color: '#888', fontWeight: '600' },

  // Pay button
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#1DB954', paddingVertical: 15, borderRadius: 14,
    marginTop: 8, marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText:     { color: '#000', fontSize: 16, fontWeight: '800' },

  // Success view
  successWrap:    { alignItems: 'center', paddingVertical: 20 },
  successTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 14, marginBottom: 8 },
  successMsg:     { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successBtn:     { backgroundColor: '#1DB954', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  successBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Pending view
  pendingWrap:  { alignItems: 'center', paddingVertical: 16 },
  pendingTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  pendingMsg:   { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 19, marginBottom: 20 },

  // Bank transfer
  countryTabs:        { flexDirection: 'row', gap: 8, marginBottom: 16 },
  countryTab:         { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1A1A1A', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  countryTabActive:   { backgroundColor: '#3B82F615', borderColor: '#3B82F6' },
  countryTabText:     { fontSize: 13, color: '#555', fontWeight: '600' },
  countryTabTextActive: { color: '#3B82F6' },

  alreadyPremium:      { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', padding: 40 },
  alreadyPremiumTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 20, marginBottom: 10 },
  alreadyPremiumSub:   { fontSize: 15, color: '#666', marginBottom: 36, textAlign: 'center' },
  doneBtn:             { backgroundColor: '#1DB954', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 14 },
  doneBtnText:         { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// Shared input styles (referenced by module-scope TextInput components above)
const ss = StyleSheet.create({
  input: {
    backgroundColor: '#1A1A1A', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 15, marginBottom: 12,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  fieldLabel: { fontSize: 11, color: '#555', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  fieldHint:  { fontSize: 11, color: '#444', marginBottom: 16, lineHeight: 16 },
  errorText:  { fontSize: 13, color: '#FF4444', marginBottom: 12, textAlign: 'center' },
});
