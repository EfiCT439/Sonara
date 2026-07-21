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
  { key: 'card',   icon: 'card',          label: 'Credit / Debit Card',  desc: 'Visa, Mastercard, Verve' },
  { key: 'mtn',   icon: 'phone-portrait', label: 'MTN Mobile Money',     desc: 'Nigeria (USSD) & Cameroon (push)' },
  { key: 'orange', icon: 'phone-portrait', label: 'Orange Money',         desc: 'Cameroon only · +237 prefix' },
  { key: 'bank',  icon: 'business',       label: 'Bank Transfer',        desc: 'Any country · Manual review' },
];

// Bank transfer is reviewed by hand, so it isn't limited to the Flutterwave
// mobile-money corridors — any country can submit details. "name|ISO2|currency";
// the flag is derived from the ISO code rather than stored, so this stays readable.
const COUNTRY_DATA = `Afghanistan|AF|AFN
Albania|AL|ALL
Algeria|DZ|DZD
Andorra|AD|EUR
Angola|AO|AOA
Antigua and Barbuda|AG|XCD
Argentina|AR|ARS
Armenia|AM|AMD
Australia|AU|AUD
Austria|AT|EUR
Azerbaijan|AZ|AZN
Bahamas|BS|BSD
Bahrain|BH|BHD
Bangladesh|BD|BDT
Barbados|BB|BBD
Belarus|BY|BYN
Belgium|BE|EUR
Belize|BZ|BZD
Benin|BJ|XOF
Bhutan|BT|BTN
Bolivia|BO|BOB
Bosnia and Herzegovina|BA|BAM
Botswana|BW|BWP
Brazil|BR|BRL
Brunei|BN|BND
Bulgaria|BG|BGN
Burkina Faso|BF|XOF
Burundi|BI|BIF
Cabo Verde|CV|CVE
Cambodia|KH|KHR
Cameroon|CM|XAF
Canada|CA|CAD
Central African Republic|CF|XAF
Chad|TD|XAF
Chile|CL|CLP
China|CN|CNY
Colombia|CO|COP
Comoros|KM|KMF
Congo (Brazzaville)|CG|XAF
Congo (Kinshasa)|CD|CDF
Costa Rica|CR|CRC
Côte d'Ivoire|CI|XOF
Croatia|HR|EUR
Cuba|CU|CUP
Cyprus|CY|EUR
Czechia|CZ|CZK
Denmark|DK|DKK
Djibouti|DJ|DJF
Dominica|DM|XCD
Dominican Republic|DO|DOP
Ecuador|EC|USD
Egypt|EG|EGP
El Salvador|SV|USD
Equatorial Guinea|GQ|XAF
Eritrea|ER|ERN
Estonia|EE|EUR
Eswatini|SZ|SZL
Ethiopia|ET|ETB
Fiji|FJ|FJD
Finland|FI|EUR
France|FR|EUR
Gabon|GA|XAF
Gambia|GM|GMD
Georgia|GE|GEL
Germany|DE|EUR
Ghana|GH|GHS
Greece|GR|EUR
Grenada|GD|XCD
Guatemala|GT|GTQ
Guinea|GN|GNF
Guinea-Bissau|GW|XOF
Guyana|GY|GYD
Haiti|HT|HTG
Honduras|HN|HNL
Hong Kong|HK|HKD
Hungary|HU|HUF
Iceland|IS|ISK
India|IN|INR
Indonesia|ID|IDR
Iraq|IQ|IQD
Ireland|IE|EUR
Israel|IL|ILS
Italy|IT|EUR
Jamaica|JM|JMD
Japan|JP|JPY
Jordan|JO|JOD
Kazakhstan|KZ|KZT
Kenya|KE|KES
Kiribati|KI|AUD
Kuwait|KW|KWD
Kyrgyzstan|KG|KGS
Laos|LA|LAK
Latvia|LV|EUR
Lebanon|LB|LBP
Lesotho|LS|LSL
Liberia|LR|LRD
Libya|LY|LYD
Liechtenstein|LI|CHF
Lithuania|LT|EUR
Luxembourg|LU|EUR
Madagascar|MG|MGA
Malawi|MW|MWK
Malaysia|MY|MYR
Maldives|MV|MVR
Mali|ML|XOF
Malta|MT|EUR
Mauritania|MR|MRU
Mauritius|MU|MUR
Mexico|MX|MXN
Moldova|MD|MDL
Monaco|MC|EUR
Mongolia|MN|MNT
Montenegro|ME|EUR
Morocco|MA|MAD
Mozambique|MZ|MZN
Myanmar|MM|MMK
Namibia|NA|NAD
Nepal|NP|NPR
Netherlands|NL|EUR
New Zealand|NZ|NZD
Nicaragua|NI|NIO
Niger|NE|XOF
Nigeria|NG|NGN
North Macedonia|MK|MKD
Norway|NO|NOK
Oman|OM|OMR
Pakistan|PK|PKR
Palestine|PS|ILS
Panama|PA|PAB
Papua New Guinea|PG|PGK
Paraguay|PY|PYG
Peru|PE|PEN
Philippines|PH|PHP
Poland|PL|PLN
Portugal|PT|EUR
Qatar|QA|QAR
Romania|RO|RON
Russia|RU|RUB
Rwanda|RW|RWF
Saint Lucia|LC|XCD
Samoa|WS|WST
San Marino|SM|EUR
Saudi Arabia|SA|SAR
Senegal|SN|XOF
Serbia|RS|RSD
Seychelles|SC|SCR
Sierra Leone|SL|SLE
Singapore|SG|SGD
Slovakia|SK|EUR
Slovenia|SI|EUR
Solomon Islands|SB|SBD
Somalia|SO|SOS
South Africa|ZA|ZAR
South Korea|KR|KRW
South Sudan|SS|SSP
Spain|ES|EUR
Sri Lanka|LK|LKR
Sudan|SD|SDG
Suriname|SR|SRD
Sweden|SE|SEK
Switzerland|CH|CHF
Taiwan|TW|TWD
Tajikistan|TJ|TJS
Tanzania|TZ|TZS
Thailand|TH|THB
Timor-Leste|TL|USD
Togo|TG|XOF
Tonga|TO|TOP
Trinidad and Tobago|TT|TTD
Tunisia|TN|TND
Türkiye|TR|TRY
Turkmenistan|TM|TMT
Uganda|UG|UGX
Ukraine|UA|UAH
United Arab Emirates|AE|AED
United Kingdom|GB|GBP
United States|US|USD
Uruguay|UY|UYU
Uzbekistan|UZ|UZS
Vanuatu|VU|VUV
Vatican City|VA|EUR
Venezuela|VE|VES
Vietnam|VN|VND
Yemen|YE|YER
Zambia|ZM|ZMW
Zimbabwe|ZW|ZWL`;

// ISO 3166 letters map onto the regional-indicator block, so the flag falls out of
// the country code — no need to store 190 emoji by hand.
const flagOf = (iso) =>
  String.fromCodePoint(...iso.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65));

const COUNTRIES = COUNTRY_DATA.split('\n').map(line => {
  const [name, iso, currency] = line.split('|');
  return { name, iso, currency, flag: flagOf(iso) };
});

// ─── Module-scope sub-components (TextInput keyboard-bug rule) ────────────────
function PhoneField({ ss, c, value, onChangeText, placeholder }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.textFaint}
      keyboardType="phone-pad"
      autoCorrect={false}
    />
  );
}

function CardNameField({ ss, c, value, onChangeText }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder="Cardholder name"
      placeholderTextColor={c.textFaint}
      autoCapitalize="words"
      autoCorrect={false}
    />
  );
}

function CardNumField({ ss, c, value, onChangeText }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder="1234 5678 9012 3456"
      placeholderTextColor={c.textFaint}
      keyboardType="numeric"
      maxLength={19}
    />
  );
}

function CardExpiryField({ ss, c, value, onChangeText }) {
  return (
    <TextInput
      style={[ss.input, { flex: 1, marginBottom: 0 }]}
      value={value}
      onChangeText={onChangeText}
      placeholder="MM/YY"
      placeholderTextColor={c.textFaint}
      keyboardType="numeric"
      maxLength={5}
    />
  );
}

function CardCVVField({ ss, c, value, onChangeText }) {
  return (
    <TextInput
      style={[ss.input, { flex: 1, marginBottom: 0 }]}
      value={value}
      onChangeText={onChangeText}
      placeholder="CVV"
      placeholderTextColor={c.textFaint}
      keyboardType="numeric"
      maxLength={4}
      secureTextEntry
    />
  );
}

function BankNameField({ ss, c, value, onChangeText, placeholder }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.textFaint}
      autoCapitalize="words"
      autoCorrect={false}
    />
  );
}

function BankAcctNameField({ ss, c, value, onChangeText }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder="Account holder name"
      placeholderTextColor={c.textFaint}
      autoCapitalize="words"
      autoCorrect={false}
    />
  );
}

function BankAcctNumField({ ss, c, value, onChangeText, placeholder }) {
  return (
    <TextInput
      style={ss.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.textFaint}
      keyboardType="numeric"
      maxLength={12}
    />
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PaywallScreen({ navigation }) {
  const { isPremium, setIsPremium } = useUser();
  const { colors: c } = useUser();
  const styles = makeStyles(c);
  const ss = makeSS(c);
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
  const [bankCountry,  setBankCountry]  = useState('NG'); // ISO 3166 alpha-2
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
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

  const selectedCountry = COUNTRIES.find(c => c.iso === bankCountry) || COUNTRIES[0];

  const visibleCountries = (() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.iso.toLowerCase() === q);
  })();

  const pickCountry = (iso) => {
    setBankCountry(iso);
    setShowCountryPicker(false);
    setCountryQuery('');
  };

  const handleBankSubmit = () => {
    if (!bankName.trim()) { Alert.alert('Missing field', 'Enter your bank name.'); return; }
    if (!bankAcctName.trim()) { Alert.alert('Missing field', 'Enter the account holder name.'); return; }
    // Account-number length varies by country; Nigeria's NUBAN is a fixed 10 digits.
    // Elsewhere just require something plausible rather than inventing a rule.
    const minLen = bankCountry === 'NG' ? 10 : 6;
    if (bankAcctNum.replace(/\D/g, '').length < minLen) {
      Alert.alert('Invalid account', `Enter a valid account number (${minLen}+ digits).`);
      return;
    }
    setBankDone(true);
  };

  if (isPremium) {
    return (
      <View style={styles.alreadyPremium}>
        
        <Text style={styles.alreadyPremiumTitle}>You're Premium!</Text>
        <Text style={styles.alreadyPremiumSub}>Enjoy all features with no limits.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>Back to Sonara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mmLabel = activeModal === 'mtn' ? 'MTN Mobile Money' : 'Orange Money';
  const mmHint  = activeModal === 'orange' ? '+237 prefix required (Cameroon)' : '🇳🇬 Nigeria: +234 · 🇨🇲 Cameroon: +237';
  const mmPlaceholder = activeModal === 'orange' ? '+237 6XX XXX XXX' : '+237 or +234...';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={c.icon} />
        </TouchableOpacity>

        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.crownCircle}>
            
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
                    color={f.ok ? c.icon : c.textFaint} />
                  <Text style={[styles.featureText, !f.ok && styles.featureTextMuted]}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.tierCard, styles.premiumTierCard]}>
            <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>BEST</Text></View>
            
            <Text style={[styles.tierName, styles.premiumTierName]}>Premium</Text>
            <Text style={[styles.tierPrice, styles.premiumTierPrice]}>$1</Text>
            <View style={styles.featureList}>
              {PREMIUM_FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={15} color={c.textDim} />
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
          <Ionicons name="flash" size={20} color={c.accentText} />
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
                <View style={styles.methodIcon}>
                  <Ionicons name={m.icon} size={22} color={c.icon} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodLabel}>{m.label}</Text>
                  <Text style={styles.methodDesc}>{m.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
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
                <View style={styles.modalIconCircle}>
                  <Ionicons name="phone-portrait" size={26} color={c.icon} />
                </View>
                <Text style={styles.sheetTitle}>{mmLabel}</Text>
                {activeModal === 'orange' && (
                  <View style={styles.cmBadge}><Text style={styles.cmBadgeText}>🇨🇲 Cameroon Only</Text></View>
                )}
              </View>

              {mmPhase === 'success' ? (
                <View style={styles.successWrap}>
                  <Ionicons name="checkmark-circle" size={56} color={c.icon} />
                  <Text style={styles.successTitle}>Payment Successful!</Text>
                  <Text style={styles.successMsg}>Welcome to Sonara Premium. All features are now unlocked.</Text>
                  <TouchableOpacity style={styles.successBtn} onPress={() => { closeModal(); navigation.goBack(); }} activeOpacity={0.85}>
                    <Text style={styles.successBtnText}>Start Listening</Text>
                  </TouchableOpacity>
                </View>
              ) : mmPhase === 'pending' ? (
                <View style={styles.pendingWrap}>
                  <ActivityIndicator size="large" color={c.icon} style={{ marginBottom: 16 }} />
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
                  <PhoneField ss={ss} c={c} value={phone} onChangeText={setPhone} placeholder={mmPlaceholder} />
                  <Text style={ss.fieldHint}>{mmHint}</Text>

                  {mmPhase === 'failed' && <Text style={ss.errorText}>{mmMessage}</Text>}

                  <TouchableOpacity
                    style={[styles.payBtn, mmLoading && styles.payBtnDisabled]}
                    onPress={handleMobileMoneyPay}
                    disabled={mmLoading}
                    activeOpacity={0.85}>
                    {mmLoading
                      ? <ActivityIndicator color={c.accentText} size="small" />
                      : <><Ionicons name="send" size={16} color={c.accentText} /><Text style={[styles.payBtnText, { color: '#000' }]}>Send Payment Request</Text></>}
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
                <View style={styles.modalIconCircle}>
                  <Ionicons name="card" size={26} color={c.icon} />
                </View>
                <Text style={styles.sheetTitle}>Credit / Debit Card</Text>
              </View>

              {cardPhase === 'success' ? (
                <View style={styles.successWrap}>
                  <Ionicons name="checkmark-circle" size={56} color={c.icon} />
                  <Text style={styles.successTitle}>Payment Confirmed!</Text>
                  <Text style={styles.successMsg}>Premium is now active on your account.</Text>
                  <TouchableOpacity style={styles.successBtn} onPress={() => { closeModal(); navigation.goBack(); }} activeOpacity={0.85}>
                    <Text style={styles.successBtnText}>Start Listening</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={ss.fieldLabel}>Cardholder Name</Text>
                  <CardNameField ss={ss} c={c} value={cardName} onChangeText={setCardName} />

                  <Text style={ss.fieldLabel}>Card Number</Text>
                  <CardNumField ss={ss} c={c} value={cardNum} onChangeText={(t) => setCardNum(formatCardNum(t))} />

                  <View style={{ flexDirection: 'row', marginBottom: 14 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={ss.fieldLabel}>Expiry</Text>
                      <CardExpiryField ss={ss} c={c} value={cardExpiry} onChangeText={(t) => setCardExpiry(formatExpiry(t))} />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={ss.fieldLabel}>CVV</Text>
                      <CardCVVField ss={ss} c={c} value={cardCVV} onChangeText={setCardCVV} />
                    </View>
                  </View>

                  <Text style={ss.fieldHint}>🔒 Card details processed securely via Flutterwave</Text>

                  <TouchableOpacity
                    style={[styles.payBtn, cardLoading && styles.payBtnDisabled]}
                    onPress={handleCardPay}
                    disabled={cardLoading}
                    activeOpacity={0.85}>
                    {cardLoading
                      ? <ActivityIndicator color={c.accentText} size="small" />
                      : <><Ionicons name="lock-closed" size={16} color={c.accentText} /><Text style={styles.payBtnText}>Pay Securely — $1</Text></>}
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
                <View style={styles.modalIconCircle}>
                  <Ionicons name="business" size={26} color={c.icon} />
                </View>
                <Text style={styles.sheetTitle}>Bank Transfer</Text>
              </View>

              {bankDone ? (
                <View style={styles.pendingWrap}>
                  <Ionicons name="time-outline" size={52} color={c.textDim} style={{ marginBottom: 12 }} />
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
                  <Text style={ss.fieldLabel}>Country</Text>
                  <TouchableOpacity
                    style={styles.countrySelect}
                    onPress={() => setShowCountryPicker(true)}
                    activeOpacity={0.75}>
                    <Text style={styles.countrySelectFlag}>{selectedCountry.flag}</Text>
                    <Text style={styles.countrySelectName} numberOfLines={1}>{selectedCountry.name}</Text>
                    <Text style={styles.countrySelectCode}>{selectedCountry.currency}</Text>
                    <Ionicons name="chevron-down" size={16} color={c.textFaint} />
                  </TouchableOpacity>

                  <Text style={ss.fieldLabel}>Bank Name</Text>
                  <BankNameField
                    ss={ss} c={c}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder={bankCountry === 'NG' ? 'e.g. GTBank, Access Bank' : 'Your bank or service'}
                  />

                  <Text style={ss.fieldLabel}>Account Holder Name</Text>
                  <BankAcctNameField ss={ss} c={c} value={bankAcctName} onChangeText={setBankAcctName} />

                  <Text style={ss.fieldLabel}>Account Number</Text>
                  <BankAcctNumField
                    ss={ss} c={c}
                    value={bankAcctNum}
                    onChangeText={(t) => setBankAcctNum(t.replace(/\D/g, ''))}
                    placeholder={bankCountry === 'NG' ? '10-digit NUBAN' : 'Your account number'}
                  />

                  <Text style={ss.fieldHint}>
                    Enter your own bank details. Premium is $1/month, billed in {selectedCountry.currency}.
                    We'll verify and activate after review.
                  </Text>

                  <TouchableOpacity style={styles.payBtn} onPress={handleBankSubmit} activeOpacity={0.85}>
                    <Text style={styles.payBtnText}>Submit Bank Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sheetCancel} onPress={closeModal}>
                    <Text style={styles.sheetCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Country picker — an in-place overlay, NOT a second Modal. A Modal
              presented on top of an already-open Modal does not reliably appear
              (especially on iOS), which is why the picker wasn't opening. */}
          {showCountryPicker && (
            <View style={styles.pickerOverlay}>
              <TouchableOpacity
                style={styles.pickerBackdrop}
                activeOpacity={1}
                onPress={() => setShowCountryPicker(false)}
              />
              <View style={[styles.sheet, styles.countrySheet]}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Select Country</Text>

                <View style={styles.countrySearch}>
                  <Ionicons name="search" size={15} color={c.textFaint} />
                  <TextInput
                    style={styles.countrySearchInput}
                    placeholder="Search countries"
                    placeholderTextColor={c.textFaint}
                    value={countryQuery}
                    onChangeText={setCountryQuery}
                    autoCorrect={false}
                    autoCapitalize="none"
                    autoFocus
                  />
                  {countryQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setCountryQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={15} color={c.textFaint} />
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {visibleCountries.length === 0 ? (
                    <Text style={styles.countryEmpty}>No country matches “{countryQuery.trim()}”.</Text>
                  ) : (
                    visibleCountries.map(ct => (
                      <TouchableOpacity
                        key={ct.iso}
                        style={styles.countryRow}
                        onPress={() => pickCountry(ct.iso)}
                        activeOpacity={0.75}>
                        <Text style={styles.countryRowFlag}>{ct.flag}</Text>
                        <Text style={styles.countryRowName} numberOfLines={1}>{ct.name}</Text>
                        <Text style={styles.countryRowCurrency}>{ct.currency}</Text>
                        {ct.iso === bankCountry && <Ionicons name="checkmark" size={16} color={c.icon} />}
                      </TouchableOpacity>
                    ))
                  )}
                  <View style={{ height: 20 }} />
                </ScrollView>

                <TouchableOpacity style={styles.sheetCancel} onPress={() => setShowCountryPicker(false)}>
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: c.elevated, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },

  hero: { alignItems: 'center', marginBottom: 32 },
  crownCircle: {
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  heroTitle:    { fontSize: 28, fontWeight: '800', color: c.text, letterSpacing: 0.5, marginBottom: 8 },
  heroPrice:    { fontSize: 42, fontWeight: '900', color: c.text, marginBottom: 6, letterSpacing: -1 },
  heroPriceSub: { fontSize: 18, fontWeight: '500', color: c.textDim },
  heroTagline:  { fontSize: 13, color: c.textFaint },

  comparison: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  tierCard: {
    flex: 1, backgroundColor: c.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: c.border,
  },
  premiumTierCard: { borderColor: c.borderStrong, backgroundColor: c.surface },
  bestBadge: {
    backgroundColor: c.accent, alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8,
  },
  bestBadgeText:    { color: c.accentText, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  tierName:         { fontSize: 16, fontWeight: '700', color: c.textDim, marginBottom: 4 },
  premiumTierName:  { color: c.text },
  tierPrice:        { fontSize: 22, fontWeight: '900', color: c.textFaint, marginBottom: 14 },
  premiumTierPrice: { color: c.text },
  featureList:  { gap: 9 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureText:  { fontSize: 11, color: c.textDim, flex: 1 },
  featureTextMuted: { color: c.textFaint },

  ctaWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: c.bg, paddingHorizontal: 20,
    paddingTop: 14, paddingBottom: 34,
    borderTopWidth: 1, borderTopColor: c.border,
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: c.accent, paddingVertical: 16, borderRadius: 12,
    marginBottom: 10,
  },
  ctaBtnText:    { color: c.accentText, fontSize: 17, fontWeight: '800' },
  ctaDisclaimer: { color: c.textFaint, fontSize: 11, textAlign: 'center' },

  // Sheet / overlay
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#333', alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle:      { fontSize: 20, fontWeight: '800', color: c.text, marginBottom: 4, textAlign: 'center' },
  sheetSub:        { fontSize: 13, color: c.textFaint, marginBottom: 20, textAlign: 'center' },
  sheetCancel:     { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  sheetCancelText: { color: c.textFaint, fontSize: 14, fontWeight: '600' },

  methodRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  methodIcon: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: c.elevated, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  methodInfo:  { flex: 1 },
  methodLabel: { fontSize: 15, fontWeight: '700', color: c.text },
  methodDesc:  { fontSize: 12, color: c.textFaint, marginTop: 2 },

  // Modal header
  modalHeader:     { alignItems: 'center', marginBottom: 20 },
  modalIconCircle: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: c.elevated, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  cmBadge:     { backgroundColor: c.elevated, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  cmBadgeText: { fontSize: 12, color: c.textDim, fontWeight: '600' },

  // Pay button
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: c.accent, paddingVertical: 15, borderRadius: 12,
    marginTop: 8, marginBottom: 4,
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText:     { color: c.accentText, fontSize: 16, fontWeight: '800' },

  // Success view
  successWrap:    { alignItems: 'center', paddingVertical: 20 },
  successTitle:   { fontSize: 22, fontWeight: '800', color: c.text, marginTop: 14, marginBottom: 8 },
  successMsg:     { fontSize: 14, color: c.textDim, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successBtn:     { backgroundColor: c.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  successBtnText: { color: c.accentText, fontSize: 16, fontWeight: '800' },

  // Pending view
  pendingWrap:  { alignItems: 'center', paddingVertical: 16 },
  pendingTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 8 },
  pendingMsg:   { fontSize: 13, color: c.textDim, textAlign: 'center', lineHeight: 19, marginBottom: 20 },

  // Bank transfer
  // Country select + picker
  countrySelect: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: c.elevated, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: c.borderStrong, marginBottom: 14,
  },
  countrySelectFlag:  { fontSize: 20 },
  countrySelectName:  { flex: 1, color: c.text, fontSize: 15, fontWeight: '700' },
  countrySelectCode:  { color: c.textDim, fontSize: 12, fontWeight: '800' },
  countrySheet:       { maxHeight: '85%' },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.overlay,
    justifyContent: 'flex-end',
    zIndex: 50, elevation: 50,
  },
  pickerBackdrop: { ...StyleSheet.absoluteFillObject },
  countrySearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.elevated, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: c.borderStrong, marginBottom: 12, marginTop: 8,
  },
  countrySearchInput: { flex: 1, color: c.text, fontSize: 14, fontWeight: '600', padding: 0 },
  countryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  countryRowFlag:     { fontSize: 20 },
  countryRowName:     { flex: 1, color: c.text, fontSize: 14.5, fontWeight: '600' },
  countryRowCurrency: { color: c.textFaint, fontSize: 11, fontWeight: '800' },
  countryEmpty:       { color: c.textFaint, fontSize: 13, textAlign: 'center', paddingVertical: 24, fontWeight: '600' },

  alreadyPremium:      { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 40 },
  alreadyPremiumTitle: { fontSize: 26, fontWeight: '800', color: c.text, marginTop: 20, marginBottom: 10 },
  alreadyPremiumSub:   { fontSize: 15, color: c.textFaint, marginBottom: 36, textAlign: 'center' },
  doneBtn:             { backgroundColor: c.accent, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 12 },
  doneBtnText:         { color: c.accentText, fontSize: 16, fontWeight: '800' },
});

// Shared input styles (referenced by module-scope TextInput components above)
const makeSS = (c) => StyleSheet.create({
  input: {
    backgroundColor: c.elevated, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    color: c.text, fontSize: 15, marginBottom: 12,
    borderWidth: 1, borderColor: c.borderStrong,
  },
  fieldLabel: { fontSize: 11, color: c.textFaint, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  fieldHint:  { fontSize: 11, color: c.textFaint, marginBottom: 16, lineHeight: 16 },
  errorText:  { fontSize: 13, color: c.danger, marginBottom: 12, textAlign: 'center' },
});
