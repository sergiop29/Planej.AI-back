from django.urls import path
from .views import RegisterView, FinancialAgentView, UploadCSVVectorstoreView, FinancialRecordListView, FinancialIndicatorsView, FinancialTrendsView, ExpenseDistributionView, ExpenseTypePercentageView, CashFlowView, indice_saude, analise_saude, pontos_fortes, pontos_fracos, nota_saude
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('financial-agent/', FinancialAgentView.as_view(), name='financial_agent'),
    path('upload-csv-vectorstore/', UploadCSVVectorstoreView.as_view(), name='upload_csv_vectorstore'),
    path('financial-records/', FinancialRecordListView.as_view(), name='financial_records'),
    path('financial-indicators/', FinancialIndicatorsView.as_view(), name='financial_indicators'),
    path('financial-trends/', FinancialTrendsView.as_view(), name='financial_trends'),
    path('expense-distribution/', ExpenseDistributionView.as_view(), name='expense_distribution'),
    path('expense-type-percentage/', ExpenseTypePercentageView.as_view(), name='expense_type_percentage'),
    path('cash-flow/', CashFlowView.as_view(), name='cash_flow'),
    path('indice-saude/', indice_saude, name='indice_saude'),
    path('analise-saude/', analise_saude, name='analise_saude'),
    path('pontos-fortes/', pontos_fortes, name='pontos_fortes'),
    path('pontos-fracos/', pontos_fracos, name='pontos_fracos'),
    path('nota-saude/', nota_saude, name='nota_saude'),
] 