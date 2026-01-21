import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Breadcrumbs,
  Link,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { getDNSRecordsByDomain } from '../lib/mockData';
import type { DNSRecord } from '../lib/mockData';

const DNSRecords: React.FC = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [domainName, setDomainName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadRecords = () => {
    setLoading(true);
    // 模拟API调用延迟
    setTimeout(() => {
      if (domainId) {
        const data = getDNSRecordsByDomain(domainId);
        setRecords(data.records);
        setDomainName(data.domain);
      }
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadRecords();
  }, [domainId]);

  const handleRefresh = () => {
    loadRecords();
  };

  const handleBack = () => {
    navigate('/dns-config');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '正常';
      case 'pending':
        return '待生效';
      case 'error':
        return '错误';
      default:
        return status;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 面包屑导航 */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={handleBack}
          sx={{ cursor: 'pointer', textDecoration: 'none' }}
        >
          DNS配置
        </Link>
        <Typography color="text.primary">{domainName || '解析记录'}</Typography>
      </Breadcrumbs>

      {/* 页面标题 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={handleBack} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            DNS解析记录 - {domainName}
          </Typography>
        </Box>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* 解析记录列表 */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : records.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">暂无解析记录</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>记录类型</TableCell>
                    <TableCell>主机记录</TableCell>
                    <TableCell>记录值</TableCell>
                    <TableCell>TTL</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>创建时间</TableCell>
                    <TableCell>更新时间</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Chip label={record.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{record.host}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {record.value}
                        </Typography>
                      </TableCell>
                      <TableCell>{record.ttl}s</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(record.status)}
                          color={getStatusColor(record.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{record.createdAt}</TableCell>
                      <TableCell>{record.updatedAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 说明信息 */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            说明
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 这些CNAME记录由系统自动管理，用于CDN加速服务
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 当添加新网站时，系统会自动创建对应的CNAME解析记录
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 记录状态"待生效"表示DNS解析正在传播中，通常需要几分钟到几小时
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 点击刷新按钮可以获取最新的解析记录状态
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DNSRecords;
