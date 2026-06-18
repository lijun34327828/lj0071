import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Member, CheckinRecord } from '../../shared/types.js';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PlayCircle,
  RotateCcw,
  UserPlus,
  History,
} from 'lucide-react';

function isExpired(expireDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return expireDate < today;
}

export default function Admin() {
  const { members, memberTotal, checkinRecords, loadMembers, loadCheckinRecords, doCheckin, createMember, showToast } =
    useAppStore();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [keyword, setKeyword] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');

  // 模拟办卡
  const [simulateCount, setSimulateCount] = useState<number>(3);
  const [simulatePackage, setSimulatePackage] = useState<string>('times-10');
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [simulateLogs, setSimulateLogs] = useState<string[]>([]);

  // 批量核销
  const [checkinMemberId, setCheckinMemberId] = useState<number | null>(null);
  const [checkinCount, setCheckinCount] = useState<number>(5);
  const [batchCheckinLoading, setBatchCheckinLoading] = useState(false);

  const refresh = useCallback(() => {
    loadMembers(page, pageSize, searchDebounce);
    loadCheckinRecords();
  }, [loadMembers, loadCheckinRecords, page, pageSize, searchDebounce]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchDebounce(keyword);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [keyword]);

  const totalPages = Math.max(1, Math.ceil(memberTotal / pageSize));

  async function handleSimulateRegister() {
    if (simulateCount <= 0 || simulateCount > 50) {
      showToast('error', '请输入 1-50 之间的办卡数量');
      return;
    }
    setSimulateLoading(true);
    const logs: string[] = [];
    const pkgMap: Record<string, { name: string; hours: number }> = {
      'times-10': { name: '10次卡', hours: 10 },
      'times-30': { name: '30次卡', hours: 30 },
      'monthly-1': { name: '月度卡', hours: 30 },
      'monthly-3': { name: '季度卡', hours: 90 },
    };
    const pkg = pkgMap[simulatePackage];

    logs.push(`[${new Date().toLocaleTimeString()}] 开始批量办卡，共 ${simulateCount} 张 ${pkg?.name}...`);

    for (let i = 0; i < simulateCount; i++) {
      try {
        const phone = `1${String(9000000000 + Math.floor(Math.random() * 999999999)).padStart(10, '0')}`;
        const member = await createMember({
          name: `测试会员${String(i + 1).padStart(3, '0')}`,
          phone,
          gender: 'other',
          packageId: simulatePackage,
        });
        logs.push(
          `  ✓ 会员 ${member.name}(${member.phone}) 办卡成功，总课时 ${member.totalHours}，到期 ${member.expireDate}`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : '未知错误';
        logs.push(`  ✗ 第 ${i + 1} 个会员办卡失败：${msg}`);
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    logs.push(`[${new Date().toLocaleTimeString()}] 批量办卡结束`);
    setSimulateLogs((prev) => [...logs, ...prev].slice(0, 80));
    setSimulateLoading(false);
    refresh();
  }

  async function handleBatchCheckin() {
    if (!checkinMemberId) {
      showToast('info', '请先从列表中选择一个会员');
      return;
    }
    if (checkinCount <= 0 || checkinCount > 100) {
      showToast('error', '请输入 1-100 之间的核销次数');
      return;
    }
    setBatchCheckinLoading(true);
    const logs: string[] = [];
    logs.push(`[${new Date().toLocaleTimeString()}] 开始对会员 #${checkinMemberId} 连续核销 ${checkinCount} 次...`);

    for (let i = 0; i < checkinCount; i++) {
      const result = await doCheckin(checkinMemberId);
      logs.push(
        `  第 ${i + 1} 次核销：${result.success ? '✓ 成功' : '✗ 失败 - '}${result.message}`,
      );
      if (!result.success) break;
      await new Promise((r) => setTimeout(r, 80));
    }
    logs.push(`[${new Date().toLocaleTimeString()}] 批量核销结束`);
    setSimulateLogs((prev) => [...logs, ...prev].slice(0, 80));
    setBatchCheckinLoading(false);
    refresh();
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6 animate-fade-in-up">
        <h2 className="font-display text-2xl font-bold text-gym-navy flex items-center gap-2">
          <Users className="w-7 h-7 text-gym-orange" />
          后台管理
        </h2>
        <p className="text-sm text-gym-textLight mt-1">
          查看所有会员课时余额、卡片到期状态，并可进行批量模拟操作以校验数值
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="会员总数"
          value={memberTotal}
          icon={<Users className="w-5 h-5" />}
          color="from-gym-navy to-gym-navyDark"
          delay={0}
        />
        <StatCard
          label="正常会员"
          value={members.filter((m) => !isExpired(m.expireDate) && m.remainingHours > 0).length}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="from-emerald-500 to-emerald-600"
          delay={50}
        />
        <StatCard
          label="课时清零"
          value={members.filter((m) => m.remainingHours <= 0).length}
          icon={<XCircle className="w-5 h-5" />}
          color="from-gym-danger to-red-600"
          delay={100}
        />
        <StatCard
          label="已过期卡片"
          value={members.filter((m) => isExpired(m.expireDate)).length}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="from-gym-warning to-amber-600"
          delay={150}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 会员列表 */}
        <div className="lg:col-span-2 gym-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="p-5 border-b border-gym-border flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-display text-lg font-bold text-gym-navy flex items-center gap-2">
              <Users className="w-5 h-5 text-gym-orange" />
              会员列表
            </h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-gym-textLight absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="gym-input pl-9"
                placeholder="搜索姓名或手机号"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gym-bg/60">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gym-textLight">会员</th>
                  <th className="text-left px-5 py-3 font-semibold text-gym-textLight">套餐</th>
                  <th className="text-center px-5 py-3 font-semibold text-gym-textLight">课时</th>
                  <th className="text-left px-5 py-3 font-semibold text-gym-textLight">到期日期</th>
                  <th className="text-center px-5 py-3 font-semibold text-gym-textLight">操作</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gym-textLight">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>暂无会员数据</p>
                    </td>
                  </tr>
                ) : (
                  members.map((m, idx) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      index={idx}
                      selected={checkinMemberId === m.id}
                      onSelect={() => setCheckinMemberId(m.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gym-border flex items-center justify-between">
            <p className="text-sm text-gym-textLight">
              共 <span className="font-semibold text-gym-navy">{memberTotal}</span> 位会员，第 {page} / {totalPages} 页
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 rounded-lg border border-gym-border bg-white flex items-center justify-center text-gym-text hover:border-gym-orange hover:text-gym-orange disabled:opacity-40 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.min(
                  totalPages,
                  Math.max(1, page - 2) + i,
                );
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      pageNum === page
                        ? 'bg-gym-orange text-white shadow-md shadow-gym-orange/30'
                        : 'border border-gym-border bg-white text-gym-text hover:border-gym-orange hover:text-gym-orange'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg border border-gym-border bg-white flex items-center justify-center text-gym-text hover:border-gym-orange hover:text-gym-orange disabled:opacity-40 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 模拟操作区 */}
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="gym-card p-5">
            <h3 className="font-display text-lg font-bold text-gym-navy mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gym-orange" />
              模拟批量办卡
            </h3>

            <div className="space-y-3">
              <div>
                <label className="gym-label">办卡数量</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="gym-input"
                  value={simulateCount}
                  onChange={(e) => setSimulateCount(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="gym-label">选择套餐</label>
                <select
                  className="gym-input"
                  value={simulatePackage}
                  onChange={(e) => setSimulatePackage(e.target.value)}
                >
                  <option value="times-10">10次卡（10课时，365天）</option>
                  <option value="times-30">30次卡（30课时，365天）</option>
                  <option value="monthly-1">月度卡（30课时，30天）</option>
                  <option value="monthly-3">季度卡（90课时，90天）</option>
                </select>
              </div>
              <button
                onClick={handleSimulateRegister}
                disabled={simulateLoading}
                className="gym-btn-secondary w-full flex items-center justify-center gap-2"
              >
                {simulateLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    办卡中...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    执行批量办卡
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="gym-card p-5">
            <h3 className="font-display text-lg font-bold text-gym-navy mb-4 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-gym-orange" />
              模拟课程核销
            </h3>

            <div className="space-y-3">
              <div>
                <label className="gym-label">目标会员</label>
                <div className="gym-input text-sm truncate">
                  {checkinMemberId
                    ? members.find((m) => m.id === checkinMemberId)?.name +
                      '（#' + checkinMemberId + '）'
                    : '请点击左侧会员列表的"选择"按钮'}
                </div>
              </div>
              <div>
                <label className="gym-label">连续核销次数</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="gym-input"
                  value={checkinCount}
                  onChange={(e) => setCheckinCount(Number(e.target.value))}
                />
              </div>
              <button
                onClick={handleBatchCheckin}
                disabled={batchCheckinLoading || !checkinMemberId}
                className="gym-btn-primary w-full flex items-center justify-center gap-2"
              >
                {batchCheckinLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    核销中...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    执行批量核销
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="gym-card p-5">
            <h3 className="font-display text-lg font-bold text-gym-navy mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-gym-orange" />
              操作日志
            </h3>
            <div className="bg-slate-900 rounded-xl p-4 h-56 overflow-y-auto font-mono text-xs space-y-1">
              {simulateLogs.length === 0 ? (
                <p className="text-slate-500">暂无操作日志...</p>
              ) : (
                simulateLogs.map((log, i) => (
                  <p
                    key={i}
                    className={`${
                      log.includes('✓') || log.includes('成功')
                        ? 'text-emerald-400'
                        : log.includes('✗') || log.includes('失败')
                          ? 'text-red-400'
                          : 'text-slate-400'
                    }`}
                  >
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 最近核销记录 */}
      <div className="gym-card mt-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="p-5 border-b border-gym-border">
          <h3 className="font-display text-lg font-bold text-gym-navy flex items-center gap-2">
            <History className="w-5 h-5 text-gym-orange" />
            最近核销记录
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gym-bg/60">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gym-textLight">时间</th>
                <th className="text-left px-5 py-3 font-semibold text-gym-textLight">会员</th>
                <th className="text-center px-5 py-3 font-semibold text-gym-textLight">核销后剩余课时</th>
              </tr>
            </thead>
            <tbody>
              {checkinRecords.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gym-textLight">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>暂无核销记录</p>
                  </td>
                </tr>
              ) : (
                checkinRecords.slice(0, 10).map((r) => (
                  <CheckinRow key={r.id} record={r} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="gym-card p-5 animate-fade-in-up relative overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gym-textLight">{label}</p>
          <p className="font-display text-3xl font-bold text-gym-navy mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  index,
  selected,
  onSelect,
}: {
  member: Member;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const expired = isExpired(member.expireDate);
  const usedHours = member.totalHours - member.remainingHours;
  const progress = member.totalHours > 0 ? (usedHours / member.totalHours) * 100 : 0;

  return (
    <tr
      className={`border-t border-gym-border transition-colors ${
        expired ? 'bg-red-50/70' : selected ? 'bg-gym-orange/5' : 'hover:bg-gym-bg/40'
      }`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${
              expired
                ? 'bg-red-100 text-gym-danger'
                : selected
                  ? 'bg-gym-orange text-white'
                  : 'bg-gym-navy/10 text-gym-navy'
            }`}
          >
            {member.name.slice(0, 1)}
          </div>
          <div>
            <p className={`font-medium ${expired ? 'text-gym-danger' : 'text-gym-text'}`}>
              {member.name}
            </p>
            <p className="text-xs text-gym-textLight">{member.phone}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span
          className={`gym-badge ${
            member.cardType === 'times'
              ? 'bg-gym-navy/10 text-gym-navy'
              : 'bg-gym-orange/10 text-gym-orange'
          }`}
        >
          {member.cardPackage}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="min-w-[140px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gym-textLight">
              <span
                className={`font-bold text-sm ${
                  member.remainingHours <= 0 ? 'text-gym-danger' : 'text-gym-navy'
                }`}
              >
                {member.remainingHours}
              </span>
              <span className="mx-0.5">/</span>
              <span className="text-gym-text">{member.totalHours}</span>
            </span>
            <span className="text-gym-textLight">
              <Clock className="w-3 h-3 inline mr-1" />
              {usedHours} 已用
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gym-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                member.remainingHours <= 0
                  ? 'bg-gym-danger'
                  : progress > 80
                    ? 'bg-gym-warning'
                    : 'bg-gradient-to-r from-gym-orange to-gym-orangeLight'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className={`flex items-center gap-1.5 text-sm ${expired ? 'text-gym-danger font-semibold' : 'text-gym-text'}`}>
          <Calendar className="w-3.5 h-3.5" />
          {member.expireDate}
          {expired && (
            <span className="gym-badge bg-gym-danger/10 text-gym-danger ml-1">
              <AlertTriangle className="w-3 h-3 mr-1" />
              已过期
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-4 text-center">
        <button
          onClick={onSelect}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selected
              ? 'bg-gym-orange text-white shadow-md shadow-gym-orange/30'
              : 'border border-gym-border text-gym-text hover:border-gym-orange hover:text-gym-orange'
          }`}
        >
          {selected ? '已选中' : '选择'}
        </button>
      </td>
    </tr>
  );
}

function CheckinRow({ record }: { record: CheckinRecord }) {
  return (
    <tr className="border-t border-gym-border hover:bg-gym-bg/40 transition-colors">
      <td className="px-5 py-3 text-sm text-gym-textLight">{record.checkinTime}</td>
      <td className="px-5 py-3 text-sm font-medium text-gym-text">{record.memberName}</td>
      <td className="px-5 py-3 text-center">
        <span
          className={`gym-badge ${
            record.remainingAfter <= 0
              ? 'bg-gym-danger/10 text-gym-danger'
              : 'bg-gym-success/10 text-gym-success'
          }`}
        >
          {record.remainingAfter} 课时
        </span>
      </td>
    </tr>
  );
}
