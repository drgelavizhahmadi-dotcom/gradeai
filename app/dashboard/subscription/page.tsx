import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { SubscriptionButton } from '@/components/SubscriptionButton';
import { Check } from 'lucide-react';

export default async function SubscriptionPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/login');
    }

    const user = await db.user.findUnique({
        where: {
            id: session.user.id,
        },
        include: {
            _count: {
                select: {
                    uploads: true,
                },
            },
        },
    });

    if (!user) {
        redirect('/login');
    }

    const isPremium = user.subscriptionStatus === 'premium';
    const uploadCount = user._count.uploads;
    const maxFreeUploads = 5;
    const usagePercentage = Math.min((uploadCount / maxFreeUploads) * 100, 100);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Subscription</h1>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Premium Plan Card */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-6">
                        <h3 className="text-2xl font-semibold leading-none tracking-tight">Premium Plan</h3>
                        <p className="text-sm text-muted-foreground mt-2">Unlock all features for growing students.</p>
                        <div className="mt-4 flex items-baseline text-3xl font-bold">
                            $9.99
                            <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </div>

                        <ul className="mt-6 space-y-4">
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span className="text-sm">Unlimited uploads</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span className="text-sm">Grade Prediction</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span className="text-sm">Multi-language support</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span className="text-sm">Priority support</span>
                            </li>
                        </ul>
                    </div>
                    <div className="p-6 pt-0">
                        <SubscriptionButton isPremium={isPremium} />
                    </div>
                </div>

                {/* Usage Card (Free Users Only) */}
                {!isPremium && (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold leading-none tracking-tight">Free Plan Usage</h3>
                            <p className="text-sm text-muted-foreground mt-2">Your current usage of the free tier.</p>

                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Uploads</span>
                                    <span className="font-medium">{uploadCount} / {maxFreeUploads}</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-100">
                                    <div
                                        className={`h-full rounded-full transition-all ${uploadCount >= maxFreeUploads ? 'bg-red-500' : 'bg-green-500'
                                            }`}
                                        style={{ width: `${usagePercentage}%` }}
                                    />
                                </div>
                                {uploadCount >= maxFreeUploads && (
                                    <p className="text-xs text-red-500 mt-2">
                                        You have reached the limit of free uploads. Please upgrade to continue.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
