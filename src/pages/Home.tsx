import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Member, Package } from '../../shared/types.js';
import {
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Ticket,
  Zap,
  Phone,
  User,
  Venus,
} from 'lucide-react';

type Gender = 'male' | 'female' | 'other';

type TabKey = 'register' | 'checkin';

export default function Home() {
  const { packages, loadPackages, createMember, searchMemberByPhone, doCheckin, showToast } =
    useAppStore();

  const [activeTab, setActiveTab] = useState<TabKey>('register');

  // 办卡表单
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formGender, setFormGender] = useState<Gender>('other');
  const [formPackageId, setFormPackageId] = useState<string>('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // 核销
  const [searchPhone, setSearchPhone] = useState('');
  const [foundMember, setFoundMember] = useState<Member | null>(null);
  const [searching, setSearching] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const timesPackages = packages.filter((p) => p.type === 'times');
  const monthlyPackages = packages.filter((p) => p.type === 'monthly');

  const isTodayExpired = (expireDate: string) => {
    const today = new Date().toISOString().slice(0, 10);
    return expireDate < today;
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formPackageId) {
      showToast('error', '请填写完整信息并选择套餐');
      return;
    }
    if (!/^1\d{10}$/.test(formPhone)) {
      showToast('error', '请输入正确的11位手机号');
      return;
    }
    setRegisterLoading(true);
    try {
      await createMember({
        name: formName.trim(),
        phone: formPhone.trim(),
        gender: formGender,
        packageId: formPackageId,
      });
      setFormName('');
      setFormPhone('');
      setFormGender('other');
      setFormPackageId('');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '办卡失败');
    } finally {
      setRegisterLoading(false);
    }
  }

  async function handleSearchMember() {
    if (!searchPhone.trim()) {
      showToast('info', '请输入会员手机号');
      return;
    }
    setSearching(true);
    setFoundMember(null);
    try {
      const m = await searchMemberByPhone(searchPhone.trim());
      if (m) {
        setFoundMember(m);
      } else {
        showToast('info', '未找到该会员');
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '查询失败');
    } finally {
      setSearching(false);
    }
  }

  async function handleCheckin() {
    if (!foundMember) return;
    setCheckinLoading(true);
    try {
      const result = await doCheckin(foundMember.id);
      if (result.success) {
        setFoundMember({ ...foundMember, remainingHours: result.remainingHours });
      }
    } finally {
      setCheckinLoading(false);
    }
  }

  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'male', label: '男' },
    { value: 'female', label: '女' },
    { value: 'other', label: '其他' },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6 animate-fade-in-up">
        <h2 className="font-display text-2xl font-bold text-gym-navy">前台工作台</h2>
        <p className="text-sm text-gym-textLight mt-1">为会员办理健身卡，或核销到店课程</p>
      </div>

      <div className="flex gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        {(['register', 'checkin'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === tab
                ? 'bg-gym-orange text-white shadow-lg shadow-gym-orange/30'
                : 'bg-white text-gym-text border border-gym-border hover:border-gym-orange/50 hover:text-gym-orange'
            }`}
          >
            {tab === 'register' ? (
              <>
                <UserPlus className="w-4 h-4" />
                会员办卡
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                课程核销
              </>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'register' ? (
        <div className="grid lg:grid-cols-5 gap-6">
          <form
            onSubmit={handleRegister}
            className="gym-card p-6 lg:col-span-2 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            <h3 className="font-display text-lg font-bold text-gym-navy mb-5 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gym-orange" />
              录入会员信息
            </h3>

            <div className="space-y-4">
              <div>
                <label className="gym-label">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    姓名
                  </span>
                </label>
                <input
                  type="text"
                  className="gym-input"
                  placeholder="请输入会员姓名"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div>
                <label className="gym-label">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    手机号
                  </span>
                </label>
                <input
                  type="tel"
                  className="gym-input"
                  placeholder="请输入11位手机号"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                />
              </div>

              <div>
                <label className="gym-label">
                  <span className="inline-flex items-center gap-1.5">
                    <Venus className="w-3.5 h-3.5" />
                    性别
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {genderOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormGender(opt.value)}
                      className={`py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        formGender === opt.value
                          ? 'bg-gym-navy text-white border-gym-navy'
                          : 'bg-white text-gym-text border-gym-border hover:border-gym-orange/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={registerLoading}
              className="gym-btn-primary w-full mt-6 py-3 text-base font-semibold flex items-center justify-center gap-2"
            >
              {registerLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  确认办卡
                </>
              )}
            </button>
          </form>

          <div
            className="lg:col-span-3 animate-fade-in-up"
            style={{ animationDelay: '150ms' }}
          >
            <div className="gym-card p-6 h-full">
              <h3 className="font-display text-lg font-bold text-gym-navy mb-5 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-gym-orange" />
                选择消费套餐
              </h3>

              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gym-textLight mb-3 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  次卡系列
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {timesPackages.map((pkg, i) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      selected={formPackageId === pkg.id}
                      onSelect={() => setFormPackageId(pkg.id)}
                      index={i}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gym-textLight mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  月卡系列
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {monthlyPackages.map((pkg, i) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      selected={formPackageId === pkg.id}
                      onSelect={() => setFormPackageId(pkg.id)}
                      index={i + 2}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div
            className="gym-card p-6 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            <h3 className="font-display text-lg font-bold text-gym-navy mb-5 flex items-center gap-2">
              <Search className="w-5 h-5 text-gym-orange" />
              查询会员
            </h3>

            <div className="flex gap-2">
              <input
                type="tel"
                className="gym-input"
                placeholder="输入会员手机号"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchMember()}
              />
              <button
                onClick={handleSearchMember}
                disabled={searching}
                className="gym-btn-secondary px-6 whitespace-nowrap"
              >
                {searching ? '查询中...' : '查询'}
              </button>
            </div>

            <p className="text-xs text-gym-textLight mt-3">
              提示：输入 11 位会员手机号，按回车或点击查询按钮
            </p>
          </div>

          <div
            className="gym-card p-6 animate-fade-in-up"
            style={{ animationDelay: '150ms' }}
          >
            <h3 className="font-display text-lg font-bold text-gym-navy mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-gym-orange" />
              会员核销
            </h3>

            {foundMember ? (
              <div>
                <div
                  className={`rounded-xl p-4 mb-5 ${
                    isTodayExpired(foundMember.expireDate) || foundMember.remainingHours <= 0
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gradient-to-br from-gym-orange/5 to-gym-navy/5 border border-gym-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg text-gym-navy">{foundMember.name}</p>
                      <p className="text-sm text-gym-textLight">{foundMember.phone}</p>
                    </div>
                    <span
                      className={`gym-badge ${
                        foundMember.cardType === 'times'
                          ? 'bg-gym-navy/10 text-gym-navy'
                          : 'bg-gym-orange/10 text-gym-orange'
                      }`}
                    >
                      {foundMember.cardPackage}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gym-textLight">总课时</p>
                      <p className="font-display font-bold text-xl text-gym-navy">
                        {foundMember.totalHours}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gym-textLight">剩余课时</p>
                      <p
                        className={`font-display font-bold text-xl ${
                          foundMember.remainingHours <= 0 ? 'text-gym-danger' : 'text-gym-success'
                        }`}
                      >
                        {foundMember.remainingHours}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-xs text-gym-textLight">已用</p>
                      <p className="font-display font-bold text-xl text-gym-text">
                        {foundMember.totalHours - foundMember.remainingHours}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="w-4 h-4 text-gym-textLight" />
                    <span className="text-gym-textLight">到期时间：</span>
                    <span
                      className={
                        isTodayExpired(foundMember.expireDate)
                          ? 'font-semibold text-gym-danger'
                          : 'font-medium text-gym-text'
                      }
                    >
                      {foundMember.expireDate}
                      {isTodayExpired(foundMember.expireDate) && '（已过期）'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckin}
                  disabled={
                    checkinLoading ||
                    foundMember.remainingHours <= 0 ||
                    isTodayExpired(foundMember.expireDate)
                  }
                  className="gym-btn-success w-full py-3 text-base font-semibold flex items-center justify-center gap-2"
                >
                  {checkinLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      {foundMember.remainingHours <= 0
                        ? '课时已用完'
                        : isTodayExpired(foundMember.expireDate)
                          ? '卡片已过期'
                          : '确认核销本次课程'}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-gym-textLight">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">请先输入手机号查询会员</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PackageCard({
  pkg,
  selected,
  onSelect,
  index,
}: {
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative text-left rounded-xl p-4 border-2 transition-all duration-200 group animate-fade-in-up ${
        selected
          ? 'border-gym-orange bg-gym-orange/5 shadow-lg shadow-gym-orange/15 scale-[1.02]'
          : 'border-gym-border bg-white hover:border-gym-orange/50 hover:shadow-md'
      }`}
      style={{ animationDelay: `${index * 50 + 150}ms` }}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gym-orange flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="flex items-baseline justify-between mb-2">
        <h5 className="font-bold text-gym-navy text-base">{pkg.name}</h5>
        <span className="text-xs text-gym-textLight">{pkg.durationDays}天有效</span>
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="font-display font-bold text-3xl text-gym-orange">{pkg.hours}</span>
        <span className="text-sm text-gym-textLight">课时</span>
      </div>
      <p className="text-sm text-gym-textLight">
        约 <span className="text-gym-text font-semibold">¥{(pkg.price / pkg.hours).toFixed(0)}</span> / 课时
      </p>
    </button>
  );
}
