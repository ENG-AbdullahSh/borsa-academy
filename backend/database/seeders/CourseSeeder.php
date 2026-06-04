<?php

namespace Database\Seeders;

use App\Models\Course;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    /**
     * Seed realistic Arabic trading courses.
     */
    public function run(): void
    {
        $courses = [
            [
                'title' => 'أساسيات التداول وآلية عمل الأسواق',
                'slug' => 'trading-foundations-market-mechanics',
                'short_description' => 'تعرّف إلى البورصات، أنواع الأوامر، فروقات الأسعار، السيولة، وكيف تتحرك الأسواق فعلياً.',
                'description' => 'مدخل عملي إلى الأسواق المالية للمتداولين الجدد. يتعلم الطالب كيف تتم مطابقة الأوامر، وكيف تؤثر السيولة في حركة السعر، وكيف يقرأ بنية السوق قبل المخاطرة برأس المال.',
                'thumbnail' => '/images/courses/trading-foundations.jpg',
                'price' => 49.00,
                'level' => 'beginner',
                'category' => 'أساسيات التداول',
                'instructor_name' => 'مايا حداد',
                'duration_hours' => 8,
                'status' => 'published',
            ],
            [
                'title' => 'التحليل الفني للمبتدئين',
                'slug' => 'technical-analysis-for-beginners',
                'short_description' => 'تعلّم الدعم والمقاومة، الاتجاهات، الحجم، وطريقة قراءة الرسوم البيانية بخطة واضحة.',
                'description' => 'يركز هذا الكورس على أدوات التحليل الفني الأساسية التي يستخدمها المتداولون النشطون. ستتعلم قراءة الاتجاه، تحديد مناطق الدعم والمقاومة، وبناء خطة تداول دون ازدحام المؤشرات.',
                'thumbnail' => '/images/courses/technical-analysis.jpg',
                'price' => 79.00,
                'level' => 'beginner',
                'category' => 'التحليل الفني',
                'instructor_name' => 'عمر ناصر',
                'duration_hours' => 12,
                'status' => 'published',
            ],
            [
                'title' => 'نماذج الشموع وحركة السعر',
                'slug' => 'candlestick-patterns-price-action',
                'short_description' => 'اقرأ سياق الشموع، ردود فعل السوق، وإشارات حركة السعر بانضباط ووضوح.',
                'description' => 'يتعلم الطالب تفسير نماذج الشموع داخل سياق السوق الحقيقي، مع التركيز على الاستمرار والانعكاس والاختراقات الفاشلة وتقنيات التأكيد لتحسين جودة الدخول والخروج.',
                'thumbnail' => '/images/courses/price-action.jpg',
                'price' => 99.00,
                'level' => 'intermediate',
                'category' => 'حركة السعر',
                'instructor_name' => 'لينا فارس',
                'duration_hours' => 14,
                'status' => 'published',
            ],
            [
                'title' => 'إدارة المخاطر وحجم الصفقة',
                'slug' => 'risk-management-position-sizing',
                'short_description' => 'ابنِ قواعد مخاطرة، منطق وقف خسارة، وخطط حجم صفقة تحمي رأس مالك.',
                'description' => 'كورس يضع رأس المال أولاً للمتداولين الباحثين عن الاستمرارية. يغطي نسبة المخاطرة لكل صفقة، التحكم في التراجع، العائد مقابل المخاطرة، التوقع الإحصائي، وتوثيق قرارات التداول.',
                'thumbnail' => '/images/courses/risk-management.jpg',
                'price' => 89.00,
                'level' => 'beginner',
                'category' => 'إدارة المخاطر',
                'instructor_name' => 'دانيال كوهين',
                'duration_hours' => 10,
                'status' => 'published',
            ],
            [
                'title' => 'أساسيات تداول الفوركس',
                'slug' => 'forex-trading-essentials',
                'short_description' => 'تداول أزواج العملات بفهم واضح للنقاط، الجلسات، الفروقات، والمحركات الاقتصادية.',
                'description' => 'يشرح هذا الكورس أزواج العملات الرئيسية والثانوية، تذبذب الجلسات، التقويم الاقتصادي، الرافعة المالية، والإعدادات الفنية الشائعة في سوق العملات.',
                'thumbnail' => '/images/courses/forex-essentials.jpg',
                'price' => 119.00,
                'level' => 'intermediate',
                'category' => 'الفوركس',
                'instructor_name' => 'نور خليل',
                'duration_hours' => 16,
                'status' => 'published',
            ],
            [
                'title' => 'مختبر استراتيجيات تداول العملات الرقمية',
                'slug' => 'crypto-trading-strategy-lab',
                'short_description' => 'صمّم استراتيجيات كريبتو حول التذبذب، السيولة، دورات الاتجاه، وضبط المخاطر.',
                'description' => 'كورس تطبيقي للأسواق الرقمية. يعمل الطالب على أمثلة تشمل بيتكوين وإيثريوم ودورات انتقال السيولة بين العملات البديلة وإدارة المخاطر أثناء فترات الزخم العالي.',
                'thumbnail' => '/images/courses/crypto-strategy.jpg',
                'price' => 149.00,
                'level' => 'intermediate',
                'category' => 'العملات الرقمية',
                'instructor_name' => 'آدم صالح',
                'duration_hours' => 18,
                'status' => 'published',
            ],
            [
                'title' => 'أساسيات تداول الخيارات',
                'slug' => 'options-trading-basics',
                'short_description' => 'افهم عقود الشراء والبيع، القيمة الزمنية، التقلب الضمني، ومخاطر الخيارات الأساسية.',
                'description' => 'يبسط هذا الكورس عالم الخيارات دون تعقيد. يتعلم الطالب أساسيات العقود، عوامل التسعير، الصفقات الاتجاهية البسيطة، والمخاطر التي تميز الخيارات عن التداول الفوري.',
                'thumbnail' => '/images/courses/options-basics.jpg',
                'price' => 129.00,
                'level' => 'intermediate',
                'category' => 'الخيارات',
                'instructor_name' => 'رامي درويش',
                'duration_hours' => 15,
                'status' => 'published',
            ],
            [
                'title' => 'التداول المتأرجح بأنظمة الاتجاه',
                'slug' => 'swing-trading-trend-systems',
                'short_description' => 'ابنِ خطط تداول متأرجح باستخدام فلاتر الاتجاه، التصحيحات، تأكيد الاختراق، وإدارة الخروج.',
                'description' => 'منهج كامل للتداول المتأرجح في الأسهم والفوركس والعملات الرقمية. يغطي بناء قوائم المتابعة، تأهيل الاتجاه، دخول التصحيحات، نقاط الإبطال، وإدارة الصفقة.',
                'thumbnail' => '/images/courses/swing-trading.jpg',
                'price' => 159.00,
                'level' => 'advanced',
                'category' => 'التداول المتأرجح',
                'instructor_name' => 'سارة منصور',
                'duration_hours' => 20,
                'status' => 'published',
            ],
            [
                'title' => 'مفاهيم التداول الخوارزمي',
                'slug' => 'algorithmic-trading-concepts',
                'short_description' => 'تعلّم قواعد الاستراتيجية، افتراضات الاختبار الخلفي، الإشارات، مخاطر التنفيذ، ومقاييس الأداء.',
                'description' => 'كورس متقدم للمتداولين الذين يريدون تحويل الأفكار التقديرية إلى أنظمة قائمة على القواعد. يتعلم الطالب تعريف الإشارات، تقييم الاختبارات الخلفية، تجنب الإفراط في الملاءمة، وقياس جودة الاستراتيجية.',
                'thumbnail' => '/images/courses/algorithmic-trading.jpg',
                'price' => 199.00,
                'level' => 'advanced',
                'category' => 'التداول الخوارزمي',
                'instructor_name' => 'إلياس حداد',
                'duration_hours' => 24,
                'status' => 'published',
            ],
            [
                'title' => 'التحوط المتقدم للمحافظ الاستثمارية',
                'slug' => 'advanced-portfolio-hedging',
                'short_description' => 'استخدم مفاهيم التحوط لتقليل مخاطر المحافظ عبر الأسهم والعملات والتعرض للعملات الرقمية.',
                'description' => 'يقدم هذا الكورس المتقدم أطر تحوط عملية للمستثمرين والمتداولين النشطين. يغطي الارتباط، موازنة المراكز، أنظمة السوق، واتخاذ قرارات المخاطر على مستوى المحفظة.',
                'thumbnail' => '/images/courses/portfolio-hedging.jpg',
                'price' => 249.00,
                'level' => 'advanced',
                'category' => 'إدارة المحافظ',
                'instructor_name' => 'لين بركات',
                'duration_hours' => 22,
                'status' => 'published',
            ],
        ];

        foreach ($courses as $course) {
            Course::updateOrCreate(
                ['slug' => $course['slug']],
                $course,
            );
        }
    }
}
