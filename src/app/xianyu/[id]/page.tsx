"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useToast } from "@/components/Toast";
import {
    User,
    Package,
    ArrowLeft,
    RefreshCw,
    Check,
    Clock,
    X,
} from "lucide-react";

interface XianyuAccount {
    id: number;
    cookie: string;
    nickname: string;
    account_id: string;
    avatar: string;
    created_at: string;
    products: number;
    today_gmv: number;
    today_orders: number;
    today_refunds: number;
}

interface Good {
    id: number;
    xianyu_id: string;
    account_id: number;
    title: string;
    price: number;
    image: string;
    status: ITEM_STATUS_ENUMS;
    created_at: string;
    update_time: string;
}

interface CrawlerGood {
    cardData: {
        id: string;
        title?: { text?: string };
        price?: { text?: string };
        priceInfo?: { price?: string };
        image?: { imgUrl?: string; 0?: { imgUrl?: string } };
        detailParams?: { picUrl?: string };
        itemStatus?: number;
    };
}

interface CrawlerResponse {
    cardList?: CrawlerGood[];
}

enum ITEM_STATUS_ENUMS {
    ON_SALE = 0,
    SOLD = 1,
    REFUND = 2,
}

const ITEM_STATUS_MAP: Record<ITEM_STATUS_ENUMS, string> = {
    [ITEM_STATUS_ENUMS.ON_SALE]: "在售",
    [ITEM_STATUS_ENUMS.SOLD]: "已售",
    [ITEM_STATUS_ENUMS.REFUND]: "退款",
};

const is_today = (date: Date) => {
    const params_day = date.getDate();
    const day = new Date().getDate();
    return params_day === day;
};

export default function XianyuAccountPage() {
    const params = useParams();
    const router = useRouter();
    const [account, setAccount] = useState<XianyuAccount | null>(null);
    const [goods, setGoods] = useState<Good[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [editingGood, setEditingGood] = useState<Good | null>(null);
    const parentRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();

    const todayGoods = useMemo(() => {
        return goods.filter((good) => is_today(new Date(good.created_at)));
    }, [goods]);

    const virtualizer = useVirtualizer({
        count: goods.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 88,
        overscan: 5,
    });

    const circulationListCrawlerGoods = async () => {
        const goodList: CrawlerGood[] = [];
        const run = async () => {
            const LIMIT = 20;
            const res = await fetch(
                `/api/crawler/goods?cookie=${encodeURIComponent(account?.cookie || "")}&page=1&limit=${LIMIT}`,
            );
            const response: CrawlerResponse = await res.json();
            const crawlerGoods = response?.cardList || [];
            goodList.push(...crawlerGoods);
            if (crawlerGoods.length >= LIMIT) {
                run();
            }
        };
        await run();
        return goodList;
    };

    const transformGood = (crawlerGood: CrawlerGood): Good => {
        // @ts-expect-error createAt 和 updateTime 这里暂时不需要
        return {
            xianyu_id: String(crawlerGood.cardData.id),
            account_id: Number(account?.id || 0),
            title: String(crawlerGood.cardData.title?.text || ""),
            price: Number(crawlerGood.cardData.priceInfo?.price || crawlerGood.cardData.price?.text?.replace('¥', '') || 0),
            image: String(crawlerGood.cardData.detailParams?.picUrl || crawlerGood.cardData.image?.imgUrl || ""),
            status: crawlerGood.cardData?.itemStatus as ITEM_STATUS_ENUMS,
        };
    };

    useEffect(() => {
        if (params.id) {
            fetchAccount();
        }
    }, [params.id]);

    const fetchAccount = async () => {
        try {
            const res = await fetch(`/api/accounts/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setAccount(data);
                fetchGoods(data.id);
            }
        } catch (err) {
            console.error("Failed to fetch account:", err);
        }
    };

    const fetchGoods = async (accountId: number) => {
        try {
            const res = await fetch(`/api/goods/${accountId}`);
            if (res.ok) {
                const data = await res.json();
                setGoods(data);
            }
        } catch (err) {
            console.error("Failed to fetch goods:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncGoods = async () => {
        if (!account) return;
        setSyncing(true);
        try {
            const goodList = await circulationListCrawlerGoods();
            console.log(goodList, "goodList");

            const goodMap = new Map<string, Good>();
            goods.map((good) => goodMap.set(good.xianyu_id, good));

            goodList.forEach((good) => {
                const xianyu_id = good.cardData.id;

                if (goodMap.has(xianyu_id)) {
                    const oldGood = goodMap.get(xianyu_id)!;

                    const itemStatus = good.cardData
                        .itemStatus as ITEM_STATUS_ENUMS;

                    const newGood: Good = {
                        ...oldGood,
                        status: itemStatus,
                    };

                    if (oldGood.status < newGood.status) {
                        newGood.update_time = Date.now().toString();

                        fetch(`/api/goods/${newGood.id}`, {
                            method: "PUT",
                            body: JSON.stringify({
                                status: newGood.status,
                                xianyu_id: newGood.xianyu_id,
                            }),
                        });
                    }
                    goodMap.set(xianyu_id, newGood);

                    return;
                }

                const newGood = transformGood(good);
                goodMap.set(xianyu_id, newGood);
                fetch(`/api/goods`, {
                    method: "POST",
                    body: JSON.stringify(newGood),
                });
            });

            setGoods(Array.from(goodMap.values()));
            showToast("success", "同步成功");
        } catch (err) {
            console.error("Sync failed:", err);
            showToast("error", "同步失败");
        } finally {
            setSyncing(false);
        }
    };

    const handleStatusChange = async (
        xianyu_id: string,
        newStatus: ITEM_STATUS_ENUMS,
    ) => {
        if (!account) return;
        try {
            await fetch(`/api/goods/${account.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ xianyu_id, status: newStatus }),
            });
            setGoods(
                goods.map((g) =>
                    g.xianyu_id === xianyu_id ? { ...g, status: newStatus } : g,
                ),
            );
            setEditingGood(null);
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("更新状态失败");
        }
    };

    if (loading) {
        return (
            <div className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 page-content">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-32" />
                    <div className="h-40 bg-slate-200 rounded-2xl" />
                    <div className="h-96 bg-slate-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="pt-4 sm:pt-6">
                <p className="text-slate-500">账号不存在</p>
            </div>
        );
    }

    const sellingCount = goods.filter(
        (g) => g.status === ITEM_STATUS_ENUMS.ON_SALE,
    ).length;
    const soldCount = goods.filter(
        (g) => g.status === ITEM_STATUS_ENUMS.SOLD,
    ).length;
    const refundedCount = goods.filter(
        (g) => g.status === ITEM_STATUS_ENUMS.REFUND,
    ).length;

    const todayGMV = todayGoods.reduce(
        (acc, good) => acc + Number(good.price),
        0,
    );
    const todayOrderCount = todayGoods.length;
    const todayRefundCount = todayGoods.filter(
        (good) => good.status === ITEM_STATUS_ENUMS.REFUND,
    ).length;

    const refundedPercentage =
        todayOrderCount > 0
            ? ((todayRefundCount / todayOrderCount) * 100).toFixed(0) + "%"
            : 0 + "%";

    return (
        <div className="pt-4 sm:pt-6 space-y-4 sm:space-y-6 page-content">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push("/xianyu")}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                        账号详情
                    </h1>
                </div>
                <button
                    onClick={handleSyncGoods}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors cursor-pointer text-sm"
                >
                    <RefreshCw
                        className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
                    />
                    同步商品
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 sm:p-6">
                <div className="flex items-start gap-4">
                    {account.avatar ? (
                        <img
                            src={account.avatar}
                            alt={account.nickname}
                            className="w-16 h-16 rounded-2xl object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center">
                            <User className="w-8 h-8 text-violet-600" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {account.nickname || "未设置昵称"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            账号ID: {account.account_id || "未获取"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            添加时间:{" "}
                            {new Date(account.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-violet-600">
                            {sellingCount}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">在售商品</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-emerald-600">
                            {soldCount}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">已售出</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-red-600">
                            {refundedCount}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">已退款</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold text-slate-600">
                            {goods.length}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">总计商品</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">
                        ¥{todayGMV || 0}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">当日GMV</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                        {todayOrderCount || 0}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">当日出单</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">
                        {todayRefundCount || 0}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">当日退款</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                        {refundedPercentage}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">退货率</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200/60 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">商品列表</h3>
                    <span className="text-xs text-slate-400">
                        {goods.length} 个商品
                    </span>
                </div>
                <div
                    className="divide-y divide-slate-100"
                    style={{ height: "500px", overflow: "auto" }}
                    ref={parentRef}
                >
                    {goods.length === 0 ? (
                        <div className="p-8 text-center">
                            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">
                                暂无商品数据
                            </p>
                            <p className="text-slate-400 text-xs mt-1">
                                点击同步商品从闲鱼获取
                            </p>
                        </div>
                    ) : (
                        <div
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                                width: "100%",
                                position: "relative",
                            }}
                        >
                            {virtualizer
                                .getVirtualItems()
                                .map((virtualItem) => {
                                    const good = goods[virtualItem.index];
                                    return (
                                        <div
                                            key={good.id}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                transform: `translateY(${virtualItem.start}px)`,
                                            }}
                                            className="p-4 flex items-center gap-4"
                                        >
                                            {good.image ? (
                                                <img
                                                    src={good.image}
                                                    alt={good.title}
                                                    className="w-16 h-16 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-slate-300" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-800 truncate">
                                                    {good.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-sm text-emerald-600">
                                                        ¥{good.price}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {good.created_at
                                                            ? (() => {
                                                                  const d =
                                                                      new Date(
                                                                          good.created_at,
                                                                      );
                                                                  const pad = (
                                                                      n: number,
                                                                  ) =>
                                                                      n
                                                                          .toString()
                                                                          .padStart(
                                                                              2,
                                                                              "0",
                                                                          );
                                                                  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                                                              })()
                                                            : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <button
                                                    onClick={() =>
                                                        setEditingGood(good)
                                                    }
                                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                                        ITEM_STATUS_MAP[
                                                            good.status
                                                        ] === "在售"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : ITEM_STATUS_MAP[
                                                                    good.status
                                                                ] === "已售"
                                                              ? "bg-slate-100 text-slate-500"
                                                              : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {
                                                        ITEM_STATUS_MAP[
                                                            good.status
                                                        ]
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>

            {editingGood && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">
                                修改状态
                            </h3>
                            <button
                                onClick={() => setEditingGood(null)}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl">
                            {editingGood.image ? (
                                <img
                                    src={editingGood.image}
                                    alt={editingGood.title}
                                    className="w-12 h-12 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                                    <Package className="w-6 h-6 text-slate-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate text-sm">
                                    {editingGood.title}
                                </p>
                                <p className="text-sm text-emerald-600">
                                    ¥{editingGood.price}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {Object.entries(ITEM_STATUS_MAP).map(
                                ([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            handleStatusChange(
                                                editingGood.xianyu_id,
                                                parseInt(key),
                                            );
                                        }}
                                        className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                                            editingGood.status === parseInt(key)
                                                ? "bg-violet-100 text-violet-700 border-2 border-violet-500"
                                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-2 border-transparent"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
